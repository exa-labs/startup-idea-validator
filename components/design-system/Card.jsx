import React from "react";
import { Edit, ArrowUpRight, ChevronRight } from "lucide-react";

/**
 * Card variants configuration
 */
const variantStyles = {
  default: {
    container: "bg-white border-[0.5px] border-[#e5e5e5]",
    innerCard: "bg-[#faf9f8]",
  },
  white: {
    container: "bg-white",
    innerCard: "bg-[#faf9f8]",
  },
  marble: {
    container: "bg-[#f9f7f7] border-[0.5px] border-[#e5e5e5]",
    innerCard: "bg-white",
  },
  marbleSoft: {
    container: "bg-[#faf9f8]",
    innerCard: "bg-white",
  },
};

/**
 * CardBasic - Simple card with title and description
 */
export function CardBasic({
  title = "Default",
  description = "Lorem ipsum dolor sit amet consectetur.",
  variant = "default",
  className = "",
}) {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`${styles.container} w-[225px] rounded-[6px] p-4 ${className}`}>
      <p className="font-arizona text-[16px] tracking-tight text-black">{title}</p>
      <p className="mt-1.5 text-[14px] text-black/40">{description}</p>
    </div>
  );
}

/**
 * CardIcon - Card with icon, title, subtitle, and arrow
 */
export function CardIcon({
  title = "Default",
  subtitle = "Subheader",
  icon: Icon = Edit,
  variant = "default",
  className = "",
  onClick,
}) {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`${styles.container} w-[327px] rounded-[6px] p-6 ${className}`}>
      <div className="mb-4 flex h-6 w-6 items-center justify-center rounded bg-black/10">
        <Icon size={14} className="text-black/60" />
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[16px] font-medium tracking-tight text-black">{title}</p>
          <p className="text-[12px] text-black/50">{subtitle}</p>
        </div>
        <ArrowUpRight size={24} className="text-black/40" />
      </div>
    </div>
  );
}

/**
 * CardGalleryItem - Inner card for gallery carousel
 */
export function CardGalleryItem({
  title = "Default",
  subtitle = "Subheader",
  description = "Lorem ipsum dolor sit amet consectetur.",
  variant = "default",
  className = "",
}) {
  const styles = variantStyles[variant] || variantStyles.default;
  const isMarble = variant === "marble" || variant === "marbleSoft";
  const cardBg = isMarble ? "bg-white" : "bg-[#faf9f8]";

  return (
    <div
      className={`${cardBg} border-black/8 w-[220px] shrink-0 rounded-md border-[0.5px] p-3 ${className}`}
      style={{
        boxShadow:
          "0px 30px 8.5px 0px rgba(0,0,0,0), 0px 19px 7.5px 0px rgba(0,0,0,0), 0px 11px 6.5px 0px rgba(0,0,0,0.02), 0px 5px 5px 0px rgba(0,0,0,0.03), 0px 1px 2.5px 0px rgba(0,0,0,0.03)",
      }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <p className="font-arizona text-[16px] tracking-tight text-black/80">{title}</p>
        <p className="text-[10px] text-black/50">{subtitle}</p>
      </div>
      <p className="text-[14px] text-[#7d7c7c]">{description}</p>
    </div>
  );
}

/**
 * CardGalleryRow - Gallery row with carousel functionality
 */
export function CardGalleryRow({
  variant = "default",
  items = [],
  currentIndex = 0,
  onNext,
  className = "",
}) {
  const styles = variantStyles[variant] || variantStyles.default;
  const CARD_SHIFT = 248; // Card width (220px) + gap (28px)

  return (
    <div className={`${styles.container} flex items-center gap-7 rounded-md p-[18px] ${className}`}>
      <div className="-mx-[10px] -my-3 w-[488px] overflow-hidden px-[10px] py-3">
        <div
          className="flex gap-7 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * CARD_SHIFT}px)` }}
        >
          {items.map((item, i) => (
            <CardGalleryItem
              key={i}
              title={item.title}
              subtitle={item.subtitle}
              description={item.description}
              variant={variant}
            />
          ))}
        </div>
      </div>
      <button onClick={onNext} className="shrink-0 rounded p-1 transition-colors hover:bg-black/5">
        <ChevronRight size={19} className="text-black/40" />
      </button>
    </div>
  );
}

/**
 * CardGradient - Card with gradient background
 */
export function CardGradient({
  title = "Gradient",
  subtitle = "subheader",
  variant = "default", // 'default' has border, 'soft' has no border
  className = "",
}) {
  const hasBorder = variant === "default";

  return (
    <div
      className={`${hasBorder ? "border-black/8 border-[0.5px]" : ""} relative h-[186px] w-[306px] overflow-hidden rounded-[10px] ${className}`}
      style={{
        background:
          "linear-gradient(180deg, rgba(250, 249, 248, 0) 0%, rgb(250, 249, 248) 100%), rgb(255, 255, 255)",
      }}
    >
      <p className="absolute left-5 top-4 text-[16px] font-medium text-black">{title}</p>
      <p className="absolute left-5 top-9 text-[14px] text-[#9a9a9a]">{subtitle}</p>
      <div className="absolute left-[19px] top-[76px] h-[199px] w-[356px] rounded-[6px] border-[0.5px] border-[#e5e5e5] bg-white shadow-lg" />
    </div>
  );
}

/**
 * CardDivided (Two-Column Card) - Card with vertical divider
 */
export function CardDivided({
  leftTitle = "Default",
  leftSubtitle = "Subheader",
  rightTitle = "Default",
  rightSubtitle = "Subheader",
  variant = "default",
  className = "",
}) {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`${styles.container} flex w-[350px] items-start justify-center gap-5 rounded-[6px] px-4 py-3 ${className}`}
    >
      <div className="flex flex-1 items-center gap-2">
        <p className="font-arizona text-[16px] tracking-tight text-black">{leftTitle}</p>
        <p className="text-[12px] text-black/60">{leftSubtitle}</p>
      </div>
      <div className="h-[157px] w-px bg-[#e5e5e5]" />
      <div className="flex flex-1 items-center gap-2">
        <p className="font-arizona text-[16px] tracking-tight text-black">{rightTitle}</p>
        <p className="text-[12px] text-black/60">{rightSubtitle}</p>
      </div>
    </div>
  );
}

// Default export with all card components
export default {
  Basic: CardBasic,
  Icon: CardIcon,
  GalleryItem: CardGalleryItem,
  GalleryRow: CardGalleryRow,
  Gradient: CardGradient,
  Divided: CardDivided,
};
