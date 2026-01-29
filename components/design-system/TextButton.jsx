import React from "react";

/**
 * Text button component with arrow and text
 * Uses Arizona Flare serif font for elegant appearance
 */
export default function TextButton({ children = "Label", onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`font-arizona text-exa-black cursor-pointer text-xl leading-7 tracking-tight transition-opacity duration-200 hover:opacity-70 ${className} `}
    >
      ← {children}
    </button>
  );
}
