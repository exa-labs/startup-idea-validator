import React from "react";

// Ocean Notification - blue gradient background
export const NotificationOcean = ({
  title = "Ocean",
  subtitle = "Subheader",
  buttonLabel = "Label",
}) => {
  return (
    <div
      className="animate-notification-popup relative flex h-[72px] w-full max-w-[799px] items-center justify-between rounded-[12px] px-[17px]"
      style={{
        background:
          "linear-gradient(90deg, rgb(3, 8, 21) 0%, rgb(11, 17, 90) 14.39%, rgb(26, 37, 197) 43.2%, rgb(39, 110, 226) 75.54%, rgb(57, 137, 239) 100%)",
      }}
    >
      <div className="flex flex-col gap-[1px]">
        <p className="font-arizona text-[18px] tracking-[-0.36px] text-white">{title}</p>
        <p className="text-[12px] tracking-[-0.24px] text-[#dcecff]/60">{subtitle}</p>
      </div>
      <button className="flex h-[33px] items-center justify-center rounded-[8px] bg-white px-[10px]">
        <span className="text-[13px] font-medium tracking-[-0.26px] text-black">{buttonLabel}</span>
      </button>
    </div>
  );
};

// Marble Notification - light marble background
export const NotificationMarble = ({
  title = "Marble",
  subtitle = "Subheader",
  buttonLabel = "Label",
}) => {
  return (
    <div
      className="animate-notification-popup-delay-1 relative flex h-[72px] w-full max-w-[799px] items-center justify-between rounded-[12px] px-[17px]"
      style={{
        background: "linear-gradient(90deg, rgb(250, 249, 248) 0%, rgb(250, 249, 248) 100%)",
      }}
    >
      <div className="flex flex-col gap-[1px]">
        <p className="font-arizona text-[18px] tracking-[-0.36px] text-black">{title}</p>
        <p className="text-[12px] tracking-[-0.24px] text-black/60">{subtitle}</p>
      </div>
      <button className="flex h-[33px] items-center justify-center rounded-[8px] bg-white px-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)]">
        <span className="text-[13px] font-medium tracking-[-0.26px] text-black">{buttonLabel}</span>
      </button>
    </div>
  );
};

// White Notification - white background with border
export const NotificationWhite = ({
  title = "White",
  subtitle = "Subheader",
  buttonLabel = "Label",
}) => {
  return (
    <div className="animate-notification-popup-delay-2 relative flex h-[72px] w-full max-w-[799px] items-center justify-between rounded-[12px] border border-[#e5e5e5] bg-white px-[17px]">
      <div className="flex flex-col gap-[1px]">
        <p className="font-arizona text-[18px] tracking-[-0.36px] text-black">{title}</p>
        <p className="text-[12px] tracking-[-0.24px] text-black/60">{subtitle}</p>
      </div>
      <button className="flex h-[33px] items-center justify-center rounded-[8px] bg-white px-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.25)]">
        <span className="text-[13px] font-medium tracking-[-0.26px] text-black">{buttonLabel}</span>
      </button>
    </div>
  );
};

export default { NotificationOcean, NotificationMarble, NotificationWhite };
