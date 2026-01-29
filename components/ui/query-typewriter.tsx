"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface QueryTypeWriterProps {
  query: string;
  mode?: "fast" | "auto";
  className?: string;
  isTyping?: boolean;
}

export function QueryTypeWriter({
  query,
  mode = "fast",
  className,
  isTyping = true,
}: QueryTypeWriterProps) {
  // Build the code block content
  const codeContent = useMemo(() => {
    const searchType = mode === "fast" ? "keyword" : "auto";

    return {
      prefix: "result = exa.search(",
      query: query || "",
      config: `  type = "${searchType}",
  contents = {
    "text": True,
    "highlights": True
  }
)`,
    };
  }, [query, mode]);

  return (
    <div className={cn("rounded-xl border border-border bg-[#1e1e2e] overflow-hidden font-mono text-sm", className)}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#181825] border-b border-border/50">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">search.py</span>
      </div>

      {/* Code content */}
      <div className="p-4 text-[13px] leading-relaxed">
        {/* Line 1: result = exa.search( */}
        <div className="flex">
          <span className="text-purple-400 select-none w-6 text-right mr-4 opacity-50">1</span>
          <span>
            <span className="text-[#cdd6f4]">result</span>
            <span className="text-[#89dceb]"> = </span>
            <span className="text-[#f9e2af]">exa</span>
            <span className="text-[#cdd6f4]">.</span>
            <span className="text-[#89b4fa]">search</span>
            <span className="text-[#cdd6f4]">(</span>
          </span>
        </div>

        {/* Line 2: Query string with typewriter effect */}
        <div className="flex">
          <span className="text-purple-400 select-none w-6 text-right mr-4 opacity-50">2</span>
          <span className="pl-4">
            <span className="text-[#a6e3a1]">"</span>
            <span className="text-[#a6e3a1]">{codeContent.query}</span>
            {isTyping && (
              <span className="inline-block w-[2px] h-[1.1em] bg-[#a6e3a1] animate-pulse ml-[1px] align-middle" />
            )}
            <span className="text-[#a6e3a1]">"</span>
            <span className="text-[#cdd6f4]">,</span>
          </span>
        </div>

        {/* Line 3: type = "..." */}
        <div className="flex">
          <span className="text-purple-400 select-none w-6 text-right mr-4 opacity-50">3</span>
          <span className="pl-4">
            <span className="text-[#fab387]">type</span>
            <span className="text-[#89dceb]"> = </span>
            <span className="text-[#a6e3a1]">"{mode === "fast" ? "keyword" : "auto"}"</span>
            <span className="text-[#cdd6f4]">,</span>
          </span>
        </div>

        {/* Line 4: contents = { */}
        <div className="flex">
          <span className="text-purple-400 select-none w-6 text-right mr-4 opacity-50">4</span>
          <span className="pl-4">
            <span className="text-[#fab387]">contents</span>
            <span className="text-[#89dceb]"> = </span>
            <span className="text-[#cdd6f4]">{"{"}</span>
          </span>
        </div>

        {/* Line 5: "text": True */}
        <div className="flex">
          <span className="text-purple-400 select-none w-6 text-right mr-4 opacity-50">5</span>
          <span className="pl-8">
            <span className="text-[#a6e3a1]">"text"</span>
            <span className="text-[#cdd6f4]">: </span>
            <span className="text-[#fab387]">True</span>
            <span className="text-[#cdd6f4]">,</span>
          </span>
        </div>

        {/* Line 6: "highlights": True */}
        <div className="flex">
          <span className="text-purple-400 select-none w-6 text-right mr-4 opacity-50">6</span>
          <span className="pl-8">
            <span className="text-[#a6e3a1]">"highlights"</span>
            <span className="text-[#cdd6f4]">: </span>
            <span className="text-[#fab387]">True</span>
          </span>
        </div>

        {/* Line 7: } */}
        <div className="flex">
          <span className="text-purple-400 select-none w-6 text-right mr-4 opacity-50">7</span>
          <span className="pl-4">
            <span className="text-[#cdd6f4]">{"}"}</span>
          </span>
        </div>

        {/* Line 8: ) */}
        <div className="flex">
          <span className="text-purple-400 select-none w-6 text-right mr-4 opacity-50">8</span>
          <span className="text-[#cdd6f4]">)</span>
        </div>
      </div>
    </div>
  );
}
