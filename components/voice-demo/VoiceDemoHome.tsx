"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Search, MicIcon, SquareIcon } from "lucide-react";
import {
  SpeechInput,
  SpeechInputRecordButton,
  SpeechInputCancelButton,
} from "@/components/ui/speech-input";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { CommitStrategy } from "@/hooks/use-scribe";
import VoiceSearchResults from "./VoiceSearchResults";
import { QueryTypeWriter } from "@/components/ui/query-typewriter";
import { PipelineTimeline, EMPTY_TIMESTAMPS, type PipelineTimestamps } from "./PipelineTimeline";

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
  "Tell me about the latest AI startup announcements this week?",
  "How is the Meta's quarter report looking?",
  "What are the most recent announcements from Exa.ai?",
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

// Parse SSE stream from text-to-speech-stream endpoint
async function consumeStreamingTTS(
  response: Response,
  onTextChunk: (chunk: string) => void,
  onTextDone: (fullText: string, citations: number[]) => void,
  onAudioChunk: (base64: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));
        switch (currentEvent) {
          case "text":
            onTextChunk(data.chunk);
            break;
          case "textDone":
            onTextDone(data.fullText, data.citations || []);
            break;
          case "audio":
            onAudioChunk(data.chunk);
            break;
          case "done":
            onDone();
            break;
          case "error":
            onError(data.error);
            break;
        }
      }
    }
  }
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
  const [resultsTab, setResultsTab] = useState<"fast" | "content">("fast");
  const [citations, setCitations] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<PipelineTimestamps>(EMPTY_TIMESTAMPS);
  const timestampsRef = useRef<PipelineTimestamps>(EMPTY_TIMESTAMPS);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speculativeSearchRef = useRef<AbortController | null>(null);
  const lastSearchedQuery = useRef<string>("");

  const updateTimestamp = useCallback((key: keyof PipelineTimestamps, value: number) => {
    timestampsRef.current = { ...timestampsRef.current, [key]: value };
    setTimestamps(prev => ({ ...prev, [key]: value }));
  }, []);

  // Live elapsed timer - runs until TTS generation finishes
  useEffect(() => {
    if (timestamps.speechStart && !timestamps.ttsDone && state !== "idle" && state !== "done") {
      const interval = setInterval(() => {
        setLiveElapsedMs(Date.now() - timestamps.speechStart!);
      }, 16);
      return () => clearInterval(interval);
    } else if (timestamps.speechStart && timestamps.ttsDone) {
      setLiveElapsedMs(timestamps.ttsDone - timestamps.speechStart);
    }
  }, [timestamps.speechStart, timestamps.ttsDone, state]);

  // Debounce live transcript for speculative search (200ms)
  const debouncedTranscript = useDebounce(liveTranscript, 200);

  // Speculative search while user is speaking
  useEffect(() => {
    if (state !== "recording" || !debouncedTranscript.trim()) {
      return;
    }

    const query = debouncedTranscript.trim();

    // Wait for at least ~10 chars (~2 words) before speculative searching
    if (query === lastSearchedQuery.current || query.length < 10) {
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
      // Track first speculative search request
      if (!timestampsRef.current.fastSearchStart) {
        updateTimestamp("fastSearchStart", Date.now());
      }
      try {
        const response = await fetch("/api/voice-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            mode: "fast",
            numResults: 8,
            withContents: false, // Fast - titles only for instant display
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          if (state === "recording") {
            setSpeculativeResults(data.results);
            // Track when first results arrive
            if (!timestampsRef.current.fastSearchEnd) {
              updateTimestamp("fastSearchEnd", Date.now());
            }
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
  }, [debouncedTranscript, state, updateTimestamp]);

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
    const freshTimestamps = { ...EMPTY_TIMESTAMPS, speechStart: Date.now() };
    timestampsRef.current = freshTimestamps;
    setTimestamps(freshTimestamps);
    setLiveElapsedMs(0);

    setState("recording");
    setError(null);
    setTranscript("");
    setLiveTranscript("");
    setSearchResults(null);
    setSpeculativeResults(null);
    setResultsTab("fast");
    setSpokenText("");
    setCitations([]);
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

  // Shared streaming TTS logic: streams text + audio from search results
  const runStreamingTTS = useCallback(
    async (query: string, results: SearchResult[]) => {
      setState("speaking");
      setSpokenText("");

      updateTimestamp("llmStart", Date.now());

      const ttsResponse = await fetch("/api/text-to-speech-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, results }),
      });

      if (!ttsResponse.ok) {
        throw new Error("Text-to-speech failed");
      }

      const audioChunks: Uint8Array[] = [];

      await consumeStreamingTTS(
        ttsResponse,
        // onTextChunk: show text progressively
        (chunk) => {
          setSpokenText((prev) => prev + chunk);
        },
        // onTextDone: LLM text generation complete, TTS starts
        (_fullText, citationIds) => {
          const now = Date.now();
          updateTimestamp("llmDone", now);
          updateTimestamp("ttsStart", now);
          setCitations(citationIds);
        },
        // onAudioChunk: collect audio data
        (base64) => {
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          audioChunks.push(bytes);
        },
        // onDone: TTS generation complete, assemble and play audio
        () => {
          updateTimestamp("ttsDone", Date.now());

          const totalLength = audioChunks.reduce((acc, c) => acc + c.length, 0);
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }

          const audioBlob = new Blob([combined], { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          audio.onplay = () => {
            setIsSpeaking(true);
          };
          audio.onended = () => {
            setIsSpeaking(false);
            setState("done");
            URL.revokeObjectURL(audioUrl);
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            setState("done");
          };

          audio.play();
        },
        // onError
        (errorMsg) => {
          throw new Error(errorMsg);
        }
      );
    },
    [updateTimestamp]
  );

  const handleRecordingStop = useCallback(
    async (event: { transcript: string }) => {
      const finalTranscript = event.transcript.trim();

      const now = Date.now();
      updateTimestamp("speechEnd", now);

      // Close out fast search if it was started but never finished (aborted)
      if (timestampsRef.current.fastSearchStart && !timestampsRef.current.fastSearchEnd) {
        updateTimestamp("fastSearchEnd", now);
      }

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

        updateTimestamp("contentSearchStart", Date.now());

        const searchResponse = await fetch("/api/voice-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: finalTranscript,
            mode: "fast",
            numResults: 10,
            withContents: true,
          }),
        });

        if (!searchResponse.ok) {
          throw new Error("Search failed");
        }

        const searchData = await searchResponse.json();
        updateTimestamp("contentSearchEnd", Date.now());

        setSearchResults(searchData.results);
        setResultsTab("content");

        // Stream Gemini text + ElevenLabs audio
        await runStreamingTTS(finalTranscript, searchData.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setState("idle");
      }
    },
    [runStreamingTTS, updateTimestamp]
  );

  const handleStopEverything = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (speculativeSearchRef.current) {
      speculativeSearchRef.current.abort();
    }
    setIsSpeaking(false);
    setState("done");
  }, []);

  const handleExampleClick = async (query: string) => {
    setError(null);
    setTranscript(query);
    setSearchResults(null);
    setSpeculativeResults(null);
    setResultsTab("content");
    setSpokenText("");
    setCitations([]);

    const now = Date.now();
    const freshTimestamps = {
      ...EMPTY_TIMESTAMPS,
      speechStart: now,
      speechEnd: now,
      contentSearchStart: now,
    };
    timestampsRef.current = freshTimestamps;
    setTimestamps(freshTimestamps);
    setLiveElapsedMs(0);

    try {
      // Single search with contents
      setState("searching");
      const searchResponse = await fetch("/api/voice-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode: "fast",
          numResults: 10,
          withContents: true,
        }),
      });

      if (!searchResponse.ok) {
        throw new Error("Search failed");
      }

      const searchData = await searchResponse.json();

      updateTimestamp("contentSearchEnd", Date.now());

      setSearchResults(searchData.results);

      // Stream Gemini text + ElevenLabs audio
      await runStreamingTTS(query, searchData.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setState("idle");
    }
  };

  const isProcessing = ["searching", "speaking"].includes(state);
  const activeResults = resultsTab === "fast" ? speculativeResults : searchResults;
  const activeCitations = resultsTab === "content" ? citations : [];

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
                                onClick={handleStopEverything}
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
                  autoStopOnSilenceMs={1000}
                  className="w-full"
                >
                  <div className="flex items-center gap-3">
                    {isProcessing ? (
                      <button
                        onClick={handleStopEverything}
                        className="h-12 w-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-arrow-btn transition-all hover:bg-red-600"
                        aria-label="Stop"
                      >
                        <SquareIcon className="h-5 w-5 fill-current" />
                      </button>
                    ) : (
                      <SpeechInputRecordButton
                        className="h-12 w-12 rounded-full gradient-arrow-btn text-white [&_svg]:!text-white shadow-arrow-btn transition-all hover:opacity-90 disabled:opacity-50"
                      />
                    )}

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

            {/* Pipeline Timeline */}
            {timestamps.speechStart && (
              <PipelineTimeline timestamps={timestamps} className="mt-6" />
            )}

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
                {timestamps.speechStart && (
                  <span className="font-mono text-sm tabular-nums text-exa-blue font-medium">
                    {(liveElapsedMs / 1000).toFixed(2)}s
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
                {/* Tabs */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setResultsTab("fast")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      resultsTab === "fast"
                        ? "bg-exa-blue/10 text-exa-blue"
                        : "text-exa-gray-500 hover:text-exa-gray-700 hover:bg-exa-gray-200"
                    }`}
                  >
                    Fast{speculativeResults ? ` (${speculativeResults.length})` : ""}
                  </button>
                  <button
                    onClick={() => setResultsTab("content")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      resultsTab === "content"
                        ? "bg-exa-blue/10 text-exa-blue"
                        : "text-exa-gray-500 hover:text-exa-gray-700 hover:bg-exa-gray-200"
                    }`}
                  >
                    Content{searchResults ? ` (${searchResults.length})` : ""}
                  </button>
                </div>

                {state === "recording" && isSpeculativeSearching && (
                  <span className="text-xs text-exa-blue flex items-center gap-1 font-medium">
                    <Search className="h-3 w-3 animate-pulse" />
                    updating...
                  </span>
                )}
              </div>

              {activeResults && activeResults.length > 0 ? (
                <VoiceSearchResults results={activeResults} citations={activeCitations} />
              ) : (
                <div className="rounded-xl border border-dashed border-exa-gray-300 bg-white p-8 text-center shadow-tag">
                  <Search className="h-8 w-8 mx-auto mb-3 text-exa-gray-400" />
                  <p className="text-sm text-exa-gray-500">
                    {resultsTab === "content" && !searchResults
                      ? "Content results appear after recording stops"
                      : "Results will appear here as you speak"}
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
