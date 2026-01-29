import React from "react";

/**
 * Tag component for category labels
 * Displays a pill-shaped tag with subtle shadow and gradient background
 */
export default function Tag({ children, active = false, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`border-exa-gray-300 shadow-tag text-exa-gray-800 hover:border-exa-gray-400 inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-normal transition-all duration-200 ${active ? "bg-exa-gray-100 border-exa-gray-400" : "bg-exa-gray-100"} ${className} `}
      style={{
        background: "linear-gradient(90deg, rgb(250, 249, 248) 0%, rgb(250, 249, 248) 100%)",
      }}
    >
      {children}
    </button>
  );
}

/**
 * TagGroup component to display multiple tags together
 */
export function TagGroup({ tags, activeTag, onTagClick, className = "" }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {tags.map((tag) => (
        <Tag key={tag} active={activeTag === tag} onClick={() => onTagClick?.(tag)}>
          {tag}
        </Tag>
      ))}
    </div>
  );
}
