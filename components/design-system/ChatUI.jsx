import React, { useState } from "react";
import { ArrowUp } from "lucide-react";

// Suggestion Tag component
export const SuggestionTag = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="rounded-[100px] border border-[#e5e5e5] bg-white px-[12px] py-[8px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.03),0px_2px_5px_0px_rgba(0,0,0,0.03)] transition-colors hover:bg-[#f9f7f7]"
    >
      <p className="text-[12px] text-[#60646c]">{children}</p>
    </button>
  );
};

// Chat Input with Blue gradient button
export const ChatInputBlue = ({
  placeholder = "Search anything...",
  tags = ["Tag 01", "Tag 02", "Tag 03"],
  onSubmit,
}) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      onSubmit(value);
      setValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleTagClick = (tag) => {
    setValue(tag);
  };

  return (
    <div className="flex w-full max-w-[699px] flex-col items-start gap-[12px]">
      {/* Input field */}
      <div className="flex w-full items-center justify-between gap-2 rounded-[8px] border border-[#e5e7eb] bg-white p-[8px] shadow-[0px_60px_17px_0px_rgba(0,0,0,0),0px_38px_15px_0px_rgba(0,0,0,0),0px_22px_13px_0px_rgba(0,0,0,0.02),0px_10px_10px_0px_rgba(0,0,0,0.03),0px_2px_5px_0px_rgba(0,0,0,0.03)]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[14px] text-black outline-none placeholder:text-[#ababa9]"
        />
        {/* Blue gradient button */}
        <button
          onClick={handleSubmit}
          className="gradient-arrow-btn relative flex h-[32px] w-[33px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] shadow-[inset_0px_-1.5px_2px_0px_#638dff,inset_0px_0px_1px_0px_#0043fb,inset_0px_0px_2px_0px_#0043fb,inset_0px_0px_8px_0px_#0043fb,inset_0px_0px_10px_0px_#0043fb] transition-all hover:opacity-90 active:scale-95"
        >
          <ArrowUp size={18} className="text-white" />
        </button>
      </div>
      {/* Tags */}
      <div className="flex items-center gap-[12px]">
        {tags.map((tag, index) => (
          <SuggestionTag key={index} onClick={() => handleTagClick(tag)}>
            {tag}
          </SuggestionTag>
        ))}
      </div>
    </div>
  );
};

// Chat Input with Black button (larger, with label)
export const ChatInputBlack = ({
  placeholder = "Search anything...",
  buttonLabel = "Label",
  tags = ["Tag 01", "Tag 02", "Tag 03"],
  onSubmit,
}) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      onSubmit(value);
      setValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleTagClick = (tag) => {
    setValue(tag);
  };

  return (
    <div className="flex w-full max-w-[699px] flex-col items-start gap-[12px]">
      {/* Input field */}
      <div className="relative h-[78px] w-full rounded-[8px] border border-[#e5e7eb] bg-white p-[8px] shadow-[0px_60px_17px_0px_rgba(0,0,0,0),0px_38px_15px_0px_rgba(0,0,0,0),0px_22px_13px_0px_rgba(0,0,0,0.02),0px_10px_10px_0px_rgba(0,0,0,0.03),0px_2px_5px_0px_rgba(0,0,0,0.03)]">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="absolute bottom-[12px] left-[13px] right-[130px] top-[12px] resize-none bg-transparent text-[14px] text-black outline-none placeholder:text-[#ababa9]"
        />
        {/* Black button */}
        <button
          onClick={handleSubmit}
          className="absolute bottom-[8px] right-[8px] flex items-center justify-center rounded-[6px] bg-black px-[16px] py-[6px] transition-all hover:bg-black/80 active:scale-95"
        >
          <span className="text-[12px] font-medium text-white">{buttonLabel}</span>
        </button>
      </div>
      {/* Tags */}
      <div className="flex items-center gap-[12px]">
        {tags.map((tag, index) => (
          <SuggestionTag key={index} onClick={() => handleTagClick(tag)}>
            {tag}
          </SuggestionTag>
        ))}
      </div>
    </div>
  );
};

// AI Assistant small input
export const AIAssistantInput = ({ placeholder = "Need help?", onSubmit }) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (onSubmit && value.trim()) {
      onSubmit(value);
      setValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="border-black/8 flex h-[50px] w-[236px] items-center justify-between gap-2 rounded-[12px] border bg-white p-[10px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.07)]">
      <div className="flex-1 px-[4px]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-[14px] text-black outline-none placeholder:text-[#a7a7af]"
        />
      </div>
      {/* Black button */}
      <button
        onClick={handleSubmit}
        className="flex h-[32px] w-[33px] shrink-0 items-center justify-center rounded-[8px] bg-black transition-all hover:bg-black/80 active:scale-95"
      >
        <ArrowUp size={18} className="text-white" />
      </button>
    </div>
  );
};

export default { ChatInputBlue, ChatInputBlack, AIAssistantInput, SuggestionTag };
