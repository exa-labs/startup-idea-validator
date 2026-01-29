import React from "react";
import { ArrowUp } from "lucide-react";

/**
 * Jelly Button - Arrow button with gradient background and glow effect
 * Features a smooth hover transition from muted to vibrant blue
 * Used as a primary action button with visual emphasis
 */
export default function ArrowButton({ onClick, className = "", size = "md" }) {
  const sizes = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  return (
    <button
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-lg transition-transform duration-200 ease-in-out hover:scale-[1.03] ${sizes[size]} ${className} `}
    >
      {/* Base gradient layer */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: "linear-gradient(180deg, #001651 0%, #0040F0 100%)",
          boxShadow: `
            inset 0 -1.5px 2px 0 #638DFF,
            inset 0 0 10px 0 #0043FB,
            inset 0 0 8px 0 #0043FB
          `,
        }}
      />

      {/* Hover gradient layer - brighter, fades in on hover */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-100"
        style={{
          background: "linear-gradient(180deg, #001E8A 9%, #013EFF 100%)",
          boxShadow: `
            inset 0 -0.5px 1px 0 #5CCEFF,
            inset 0 -1px 3px 0 #5CCEFF,
            inset 0 -1.5px 5px 0 #5CC3FF,
            inset 0 0 12px 0 #0055DB,
            inset 0 0 10px 0 #0055DB
          `,
        }}
      />

      {/* Arrow icon */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <ArrowUp size={iconSizes[size]} className="text-white" />
      </div>
    </button>
  );
}
