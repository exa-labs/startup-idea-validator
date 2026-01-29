"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Search, MicIcon } from "lucide-react";
import {
  SpeechInput,
  SpeechInputRecordButton,
  SpeechInputCancelButton,
} from "@/components/ui/speech-input";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { CommitStrategy } from "@/hooks/use-scribe";
import VoiceSearchResults from "./VoiceSearchResults";
import { QueryTypeWriter } from "@/components/ui/query-typewriter";

interface SearchResult {
  title: string;
  url: string;
  text?: string;
  image?: string | null;
  publishedDate?: string | null;
  score?: number | null;
}

type DemoState =
  | "idle"
  | "recording"
  | "searching"
  | "speaking"
  | "done";

const EXAMPLE_QUERIES = [
  "What are the latest AI announcements this week?",
  "What's the weather in San Francisco right now?",
  "What are the most recent announcements from ElevenLabs?",
];

// Debounce hook for speculative search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function VoiceDemoHome() {
  const [state, setState] = useState<DemoState>("idle");
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [speculativeResults, setSpeculativeResults] = useState<SearchResult[] | null>(null);
  const [spokenText, setSpokenText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeculativeSearching, setIsSpeculativeSearching] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speculativeSearchRef = useRef<AbortController | null>(null);
  const lastSearchedQuery = useRef<string>("");
  const recordingStartTime = useRef<number | null>(null);
  const firstResultTime = useRef<number | null>(null);

  // Timer for elapsed milliseconds - stops when first result appears
  useEffect(() => {
    if (state === "recording") {
      recordingStartTime.current = Date.now();
      firstResultTime.current = null;
      setElapsedMs(0);
      const interval = setInterval(() => {
        if (recordingStartTime.current && !firstResultTime.current) {
          setElapsedMs(Date.now() - recordingStartTime.current);
        }
      }, 10);
      return () => clearInterval(interval);
    } else {
      recordingStartTime.current = null;
      firstResultTime.current = null;
    }
  }, [state]);

  // Capture time when first result appears
  useEffect(() => {
    if (speculativeResults && speculativeResults.length > 0 && recordingStartTime.current && !firstResultTime.current) {
      firstResultTime.current = Date.now();
      setElapsedMs(firstResultTime.current - recordingStartTime.current);
    }
  }, [speculativeResults]);

  // Debounce live transcript for speculative search (400ms)
  const debouncedTranscript = useDebounce(liveTranscript, 400);

  // Speculative search while user is speaking
  useEffect(() => {
    if (state !== "recording" || !debouncedTranscript.trim()) {
      return;
    }

    const query = debouncedTranscript.trim();

    if (query === lastSearchedQuery.current || query.length < 3) {
      return;
    }

    lastSearchedQuery.current = query;

    if (speculativeSearchRef.current) {
      speculativeSearchRef.current.abort();
    }

    const controller = new AbortController();
    speculativeSearchRef.current = controller;

    const runSpeculativeSearch = async () => {
      setIsSpeculativeSearching(true);
      try {
        const response = await fetch("/api/voice-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            mode: "fast",
            numResults: 5,
            withContents: false, // Fast - no text snippets needed for preview
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          if (state === "recording") {
            setSpeculativeResults(data.results);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.warn("Speculative search failed:", err);
        }
      } finally {
        setIsSpeculativeSearching(false);
      }
    };

    runSpeculativeSearch();

    return () => {
      controller.abort();
    };
  }, [debouncedTranscript, state]);

  const fetchScribeToken = useCallback(async () => {
    const response = await fetch("/api/elevenlabs-token", { method: "POST" });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || "Failed to get transcription token");
    }
    const data = await response.json();
    return data.token;
  }, []);

  const handleTranscriptChange = useCallback(
    (event: { transcript: string; partialTranscript: string }) => {
      const current = event.transcript || event.partialTranscript;
      setLiveTranscript(current);
      setTranscript(current);
    },
    []
  );

  const handleRecordingStart = useCallback(async () => {
    // Reset everything for a fresh conversation
    setState("recording");
    setError(null);
    setTranscript("");
    setLiveTranscript("");
    setSearchResults(null);
    setSpeculativeResults(null);
    setSpokenText("");
    setElapsedMs(0);
    lastSearchedQuery.current = "";

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  const handleScribeError = useCallback((err: Error | Event) => {
    console.error("Scribe error:", err);
    setError(err instanceof Error ? err.message : "Transcription error");
    setState("idle");
  }, []);

  const handleAuthError = useCallback((data: { error: string }) => {
    console.error("Scribe auth error:", data.error);
    setError(`Authentication error: ${data.error}`);
    setState("idle");
  }, []);

  const handleRecordingStop = useCallback(
    async (event: { transcript: string }) => {
      const finalTranscript = event.transcript.trim();

      if (speculativeSearchRef.current) {
        speculativeSearchRef.current.abort();
      }

      if (!finalTranscript) {
        setState("idle");
        return;
      }

      setTranscript(finalTranscript);

      try {
        setState("searching");

        // STAGE 1: Fast search (no contents) - display results instantly
        const fastSearchResponse = await fetch("/api/voice-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: finalTranscript,
            mode: "fast",
            numResults: 10,
            withContents: false, // Fast - just titles and URLs
          }),
        });

        if (!fastSearchResponse.ok) {
          throw new Error("Search failed");
        }

        const fastSearchData = await fastSearchResponse.json();
        setSearchResults(fastSearchData.results);
        setSpeculativeResults(null);

        // STAGE 2: Fetch with contents for TTS (in parallel with display)
        setState("speaking");

        // Fetch full results with text snippets for TTS
        const [fullSearchResponse, _] = await Promise.all([
          fetch("/api/voice-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: finalTranscript,
              mode: "fast",
              numResults: 10,
              withContents: true, // Get text for TTS
            }),
          }),
          // Small delay to let UI render first
          new Promise(resolve => setTimeout(resolve, 50)),
        ]);

        if (!fullSearchResponse.ok) {
          throw new Error("Failed to fetch content");
        }

        const fullSearchData = await fullSearchResponse.json();

        // Update results with text snippets
        setSearchResults(fullSearchData.results);

        // Generate TTS with full content
        const ttsResponse = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: finalTranscript,
            results: fullSearchData.results,
          }),
        });

        if (!ttsResponse.ok) {
          throw new Error("Text-to-speech failed");
        }

        const ttsData = await ttsResponse.json();
        setSpokenText(ttsData.text);

        const audioBlob = new Blob(
          [Uint8Array.from(atob(ttsData.audio), (c) => c.charCodeAt(0))],
          { type: ttsData.contentType }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          setState("done");
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setState("done");
        };

        await audio.play();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setState("idle");
      }
    },
    []
  );

  const handleStopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      setState("done");
    }
  }, []);

  const handleExampleClick = async (query: string) => {
    setError(null);
    setTranscript(query);
    setSearchResults(null);
    setSpeculativeResults(null);
    setSpokenText("");

    try {
      // STAGE 1: Fast search - display results instantly
      setState("searching");
      const fastSearchResponse = await fetch("/api/voice-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode: "fast",
          numResults: 10,
          withContents: false,
        }),
      });

      if (!fastSearchResponse.ok) {
        throw new Error("Search failed");
      }

      const fastSearchData = await fastSearchResponse.json();
      setSearchResults(fastSearchData.results);

      // STAGE 2: Fetch with contents for TTS
      setState("speaking");

      const fullSearchResponse = await fetch("/api/voice-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode: "fast",
          numResults: 10,
          withContents: true,
        }),
      });

      if (!fullSearchResponse.ok) {
        throw new Error("Failed to fetch content");
      }

      const fullSearchData = await fullSearchResponse.json();
      setSearchResults(fullSearchData.results);

      const ttsResponse = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          results: fullSearchData.results,
        }),
      });

      if (!ttsResponse.ok) {
        throw new Error("Text-to-speech failed");
      }

      const ttsData = await ttsResponse.json();
      setSpokenText(ttsData.text);

      const audioBlob = new Blob(
        [Uint8Array.from(atob(ttsData.audio), (c) => c.charCodeAt(0))],
        { type: ttsData.contentType }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        setState("done");
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setState("done");
      };

      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setState("idle");
    }
  };

  const isProcessing = ["searching", "speaking"].includes(state);
  const displayResults = state === "recording" ? speculativeResults : searchResults;

  return (
    <div className="min-h-screen bg-exa-gray-100 font-diatype text-exa-black">
      {/* Header */}
      <div className="border-b border-exa-gray-300 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-3">
          <h1 className="font-arizona text-xl tracking-tight text-exa-black">
            Exa Voice Search
          </h1>
          <span className="rounded-full bg-exa-blue/10 px-2.5 py-0.5 text-xs font-medium text-exa-blue">
            Beta
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT COLUMN - Conversation */}
          <div className="flex flex-col">
            <div className="rounded-2xl border border-exa-gray-300 bg-white shadow-tag flex flex-col min-h-[600px]">
              {/* Conversation Header with Waveform */}
              <div className="p-4 border-b border-exa-gray-300">
                <LiveWaveform
                  active={state === "recording"}
                  processing={state === "searching" || state === "speaking"}
                  height={60}
                  barWidth={2}
                  barGap={2}
                  barRadius={1}
                  mode="static"
                  sensitivity={1.5}
                  fadeEdges={true}
                  className="text-exa-blue"
                />
              </div>

              {/* Conversation Content */}
              <div className="flex-1 p-5 overflow-y-auto">
                {/* Idle State */}
                {state === "idle" && !liveTranscript && !transcript && (
                  <div className="h-full flex flex-col items-center justify-center text-center text-exa-gray-600">
                    <MicIcon className="h-12 w-12 mb-4 text-exa-gray-400" />
                    <p className="text-sm font-medium text-exa-gray-700">Press the mic button to start</p>
                    <p className="text-xs text-exa-gray-500 mt-1">Ask anything and get results as you speak</p>

                    {/* Example Queries */}
                    {!searchResults && (
                      <div className="mt-8 flex flex-col items-center gap-2 w-full max-w-md">
                        <span className="text-xs text-exa-gray-500 uppercase tracking-wide font-medium">Try asking</span>
                        {EXAMPLE_QUERIES.map((example) => (
                          <button
                            key={example}
                            onClick={() => handleExampleClick(example)}
                            disabled={isProcessing}
                            className="w-full rounded-lg border border-exa-gray-300 bg-exa-gray-100 px-4 py-2.5 text-xs text-exa-gray-700 transition-all hover:bg-exa-gray-200 hover:border-exa-blue-border disabled:opacity-50 text-left shadow-tag"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Live Transcription */}
                {(state === "recording" || liveTranscript || transcript) && (
                  <div className="space-y-5">
                    {/* User's speech - live or final */}
                    <div className="flex gap-3">
                      <div className="shrink-0 h-8 w-8 rounded-full gradient-arrow-btn flex items-center justify-center shadow-arrow-btn">
                        <MicIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-exa-gray-500 mb-1 font-medium">You</p>
                        <p className="text-sm text-exa-black leading-relaxed">
                          {state === "recording" ? liveTranscript || (
                            <span className="text-exa-gray-500 italic">Listening...</span>
                          ) : transcript}
                          {state === "recording" && liveTranscript && (
                            <span className="inline-block w-[2px] h-[1em] bg-exa-blue animate-pulse ml-1 align-middle" />
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Assistant Response */}
                    {spokenText && state !== "recording" && (
                      <div className="flex gap-3">
                        <div className="shrink-0 h-8 w-8 rounded-full bg-exa-gray-200 flex items-center justify-center">
                          <Volume2 className="h-4 w-4 text-exa-gray-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs text-exa-gray-500 font-medium">Exa</p>
                            {isSpeaking && (
                              <button
                                onClick={handleStopSpeaking}
                                className="flex items-center gap-1 rounded-full bg-exa-gray-200 px-2.5 py-0.5 text-xs text-exa-gray-700 hover:bg-exa-gray-300 transition-colors"
                              >
                                <VolumeX className="h-3 w-3" />
                                Stop
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-exa-dark leading-relaxed">{spokenText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Voice Input Footer */}
              <div className="p-4 border-t border-exa-gray-300 bg-exa-gray-100/50">
                <SpeechInput
                  getToken={fetchScribeToken}
                  onChange={handleTranscriptChange}
                  onStart={handleRecordingStart}
                  onStop={handleRecordingStop}
                  onError={handleScribeError}
                  onAuthError={handleAuthError}
                  commitStrategy={CommitStrategy.VAD}
                  autoStopOnSilenceMs={1500}
                  className="w-full"
                >
                  <div className="flex items-center gap-3">
                    <SpeechInputRecordButton
                      disabled={isProcessing}
                      className="h-12 w-12 rounded-full gradient-arrow-btn text-white shadow-arrow-btn transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      <MicIcon className="h-5 w-5" />
                    </SpeechInputRecordButton>

                    <div className="flex-1 flex items-center gap-2 text-sm text-exa-gray-600">
                      {state === "idle" && <span>Start a conversation</span>}
                      {state === "recording" && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-exa-blue animate-pulse" />
                          <span className="text-exa-blue font-medium">Listening...</span>
                        </div>
                      )}
                      {state === "searching" && (
                        <span className="text-exa-blue font-medium">Searching...</span>
                      )}
                      {state === "speaking" && (
                        <span className="text-exa-gray-700 flex items-center gap-1 font-medium">
                          <Volume2 className="h-3 w-3" />
                          Speaking
                        </span>
                      )}
                      {state === "done" && <span>Start a new conversation</span>}
                    </div>

                    <SpeechInputCancelButton className="text-exa-gray-500 hover:text-exa-black" />
                  </div>
                </SpeechInput>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Query Builder & Results */}
          <div className="flex flex-col gap-6">
            {/* Query Code Block */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-exa-gray-600 font-medium uppercase tracking-wide">Query Builder</span>
                {(state === "recording" || elapsedMs > 0) && (
                  <span className="font-mono text-sm tabular-nums text-exa-blue font-medium">
                    {(elapsedMs / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
              <QueryTypeWriter
                query={liveTranscript || transcript || ""}
                mode="fast"
                isTyping={state === "recording"}
              />
            </div>

            {/* Search Results */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-exa-gray-600 font-medium uppercase tracking-wide">
                  {displayResults && displayResults.length > 0
                    ? `Search Results (${displayResults.length})`
                    : "Search Results"
                  }
                </span>
                {state === "recording" && isSpeculativeSearching && (
                  <span className="text-xs text-exa-blue flex items-center gap-1 font-medium">
                    <Search className="h-3 w-3 animate-pulse" />
                    updating...
                  </span>
                )}
              </div>

              {displayResults && displayResults.length > 0 ? (
                <VoiceSearchResults results={displayResults} />
              ) : (
                <div className="rounded-xl border border-dashed border-exa-gray-300 bg-white p-8 text-center shadow-tag">
                  <Search className="h-8 w-8 mx-auto mb-3 text-exa-gray-400" />
                  <p className="text-sm text-exa-gray-500">
                    Results will appear here as you speak
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
