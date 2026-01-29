"use client";

import { useState, useEffect } from "react";

export interface PipelineTimestamps {
  // Stage 1: User talk time
  speechStart: number | null;
  speechEnd: number | null;
  // Stage 2: Fast search (titles only, speculative)
  fastSearchStart: number | null;
  fastSearchEnd: number | null;
  // Stage 3: Full search (with content)
  contentSearchStart: number | null;
  contentSearchEnd: number | null;
  // Stage 4: LLM thinking (Gemini text generation)
  llmStart: number | null;
  llmDone: number | null;
  // Stage 5: TTS generation (ElevenLabs audio)
  ttsStart: number | null;
  ttsDone: number | null;
}

export const EMPTY_TIMESTAMPS: PipelineTimestamps = {
  speechStart: null,
  speechEnd: null,
  fastSearchStart: null,
  fastSearchEnd: null,
  contentSearchStart: null,
  contentSearchEnd: null,
  llmStart: null,
  llmDone: null,
  ttsStart: null,
  ttsDone: null,
};

interface TimelineStage {
  label: string;
  startMs: number;
  durationMs: number;
  colorClass: string;
  textColorClass: string;
  completed: boolean;
  active: boolean;
}

interface PipelineTimelineProps {
  timestamps: PipelineTimestamps;
  className?: string;
}

export function PipelineTimeline({ timestamps, className }: PipelineTimelineProps) {
  const [, forceUpdate] = useState(0);

  const t0 = timestamps.speechStart;
  if (!t0) return null;

  const stages: TimelineStage[] = [];

  // 1. Speech
  if (timestamps.speechStart != null) {
    const end = timestamps.speechEnd ?? Date.now();
    stages.push({
      label: "Speech",
      startMs: 0,
      durationMs: end - t0,
      colorClass: "bg-blue-500",
      textColorClass: "text-blue-600",
      completed: timestamps.speechEnd != null,
      active: timestamps.speechEnd == null,
    });
  }

  // 2. Fast Search (speculative, titles only)
  if (timestamps.fastSearchStart != null) {
    const end = timestamps.fastSearchEnd ?? Date.now();
    stages.push({
      label: "Fast",
      startMs: timestamps.fastSearchStart - t0,
      durationMs: end - timestamps.fastSearchStart,
      colorClass: "bg-cyan-500",
      textColorClass: "text-cyan-600",
      completed: timestamps.fastSearchEnd != null,
      active: timestamps.fastSearchStart != null && timestamps.fastSearchEnd == null,
    });
  }

  // 3. Content Search (full results with text)
  if (timestamps.contentSearchStart != null) {
    const end = timestamps.contentSearchEnd ?? Date.now();
    stages.push({
      label: "Content",
      startMs: timestamps.contentSearchStart - t0,
      durationMs: end - timestamps.contentSearchStart,
      colorClass: "bg-indigo-500",
      textColorClass: "text-indigo-600",
      completed: timestamps.contentSearchEnd != null,
      active: timestamps.contentSearchStart != null && timestamps.contentSearchEnd == null,
    });
  }

  // 4. LLM thinking (Gemini text generation)
  if (timestamps.llmStart != null) {
    const end = timestamps.llmDone ?? Date.now();
    stages.push({
      label: "LLM",
      startMs: timestamps.llmStart - t0,
      durationMs: end - timestamps.llmStart,
      colorClass: "bg-amber-500",
      textColorClass: "text-amber-600",
      completed: timestamps.llmDone != null,
      active: timestamps.llmStart != null && timestamps.llmDone == null,
    });
  }

  // 5. TTS generation (ElevenLabs audio generation)
  if (timestamps.ttsStart != null) {
    const end = timestamps.ttsDone ?? Date.now();
    stages.push({
      label: "TTS",
      startMs: timestamps.ttsStart - t0,
      durationMs: end - timestamps.ttsStart,
      colorClass: "bg-emerald-500",
      textColorClass: "text-emerald-600",
      completed: timestamps.ttsDone != null,
      active: timestamps.ttsStart != null && timestamps.ttsDone == null,
    });
  }

  const hasActiveStage = stages.some((s) => s.active);

  // Re-render at ~20fps while any stage is active so bars grow in real time
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!hasActiveStage) return;
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 50);
    return () => clearInterval(interval);
  }, [hasActiveStage]);

  if (stages.length === 0) return null;

  const totalSpanMs = Math.max(...stages.map((s) => s.startMs + s.durationMs), 1);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-exa-gray-600 font-medium uppercase tracking-wide">
          Pipeline
        </span>
        {timestamps.speechEnd && timestamps.ttsDone && (
          <span className="font-mono text-xs tabular-nums text-exa-gray-500">
            {Math.round(timestamps.ttsDone - timestamps.speechEnd)}ms total
          </span>
        )}
      </div>

      <div className="rounded-xl border border-exa-gray-300 bg-white p-3 shadow-tag">
        <div className="space-y-1.5">
          {stages.map((stage) => {
            const leftPct = (stage.startMs / totalSpanMs) * 100;
            const widthPct = Math.max((stage.durationMs / totalSpanMs) * 100, 1.5);

            return (
              <div key={stage.label} className="flex items-center gap-2">
                {/* Label */}
                <span
                  className={`text-[10px] font-medium w-12 text-right shrink-0 ${stage.textColorClass}`}
                >
                  {stage.label}
                </span>

                {/* Bar track */}
                <div className="flex-1 relative h-5 bg-exa-gray-100 rounded overflow-hidden">
                  <div
                    className={`absolute top-0 bottom-0 rounded transition-all duration-100 ${stage.colorClass} ${stage.active ? "animate-pulse" : ""}`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                  />
                  {/* Duration inside bar */}
                  {stage.durationMs >= 10 && widthPct > 8 && (
                    <span
                      className="absolute top-1/2 font-mono text-[9px] text-white font-semibold whitespace-nowrap pointer-events-none"
                      style={{
                        left: `${leftPct + widthPct / 2}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {stage.durationMs >= 1000
                        ? `${(stage.durationMs / 1000).toFixed(1)}s`
                        : `${Math.round(stage.durationMs)}ms`}
                    </span>
                  )}
                </div>

                {/* Duration label */}
                <span className="text-[10px] font-mono tabular-nums text-exa-gray-500 w-14 text-right shrink-0">
                  {stage.completed
                    ? stage.durationMs >= 1000
                      ? `${(stage.durationMs / 1000).toFixed(1)}s`
                      : `${Math.round(stage.durationMs)}ms`
                    : "..."}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
