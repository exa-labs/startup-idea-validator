import React from "react";

/**
 * Card component for displaying individual UI components in the showcase
 */
export default function ComponentCard({
  children,
  title,
  description = null,
  className = "",
  wide = false,
}) {
  return (
    <div
      className={`border-exa-gray-300 relative flex flex-col items-center justify-center rounded-[6px] border bg-white px-8 py-[100px] ${wide ? "col-span-2" : ""} ${className} `}
    >
      {/* Header - Title */}
      {title && (
        <div className="absolute left-6 top-4">
          <button className="font-arizona text-[16px] tracking-[-0.02em] text-black transition-colors hover:text-[#0107c0]">
            {title}
          </button>
        </div>
      )}

      <div className="flex flex-col items-center">
        {children}
        {description && (
          <p className="text-exa-gray-600 mt-3 text-center text-sm tracking-tight">{description}</p>
        )}
      </div>
    </div>
  );
}
