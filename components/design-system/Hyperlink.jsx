import React from "react";

/**
 * Hyperlink component with custom underline styling
 * Features a blue underline offset from the text
 */
export default function Hyperlink({ children = "Hyperlink", href = "#", onClick, className = "" }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`hover:text-exa-blue cursor-pointer text-base text-black underline decoration-[#2772ff] decoration-solid decoration-[0.06em] underline-offset-2 transition-colors duration-200 ${className} `}
    >
      {children}
    </a>
  );
}
