import React from "react";
import { Plus } from "lucide-react";

/**
 * Circular icon button with subtle shadow
 * Used for adding new items or expanding content
 */
export default function IconButton({
  onClick,
  className = "",
  size = "md",
  selected = false,
  icon: Icon = Plus,
}) {
  const sizes = {
    sm: "p-[4px]",
    md: "p-[6px]",
    lg: "p-[8px]",
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 16,
  };

  // Base styles (non-selected) - matching button default's hover and active states
  const baseStyles = `
    bg-white
    border border-[#e5e5e5]
    shadow-[0px_4px_12px_0px_rgba(0,0,0,0.03),0px_2px_5px_0px_rgba(0,0,0,0.03)]
    hover:bg-[#f9f7f7] hover:border-[rgba(9,114,213,0.32)]
    active:bg-[#f9f7f7] active:border-[#e5e5e5]
  `;

  // Selected state styles
  const selectedStyles = `
    bg-[#eef8ff] border border-[#0972d5]
    shadow-[0px_1px_2px_0px_rgba(0,0,0,0.15),0px_0px_0px_3px_#dbeafe]
  `;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-200 ${selected ? selectedStyles : baseStyles} ${sizes[size]} ${className} `}
    >
      <Icon
        size={iconSizes[size]}
        className={selected ? "text-[#0972d5]" : "text-black"}
        strokeWidth={2}
      />
    </button>
  );
}
