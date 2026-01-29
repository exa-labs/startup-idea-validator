import React from "react";
import { Edit, Check } from "lucide-react";

/**
 * Button component with multiple variants matching the Exa design system
 *
 * Variants:
 * - default: White background with gray border, black text
 * - grey: White background with gray border, gray text/icons
 * - blue: White background with blue border, blue checkmark icon
 * - marble: Light gray background, gray text
 * - black: Black background, white text
 * - primary: Full-width black background, white text with shadow
 * - secondary: Full-width outlined, dark text
 */

const variantStyles = {
  default: {
    base: "bg-white border border-exa-gray-400 text-black hover:bg-[#f9f7f7] hover:border-[rgba(9,114,213,0.32)] active:bg-[#f9f7f7] active:border-[#e5e5e5]",
    iconColor: "text-black",
    selectedIconColor: "text-[#0972d5]",
  },
  grey: {
    base: "bg-white border border-exa-gray-400 text-exa-gray-600 hover:bg-[#f9f7f7] hover:border-[rgba(9,114,213,0.32)] active:bg-[#f9f7f7] active:border-[#e5e5e5]",
    iconColor: "text-exa-gray-600",
    selectedIconColor: "text-[#0972d5]",
  },
  blue: {
    base: "bg-white border border-exa-blue-border text-black hover:bg-[#f9f7f7] active:bg-[#f9f7f7] active:border-[#e5e5e5]",
    iconColor: "text-[#000]",
    selectedIconColor: "text-[#0972d5]",
  },
  marble: {
    base: "bg-exa-gray-200 border border-exa-gray-400 text-exa-gray-600 hover:bg-[#f0eeee] active:bg-[#e8e6e6]",
    iconColor: "text-exa-gray-600",
    selectedIconColor: "text-[#0972d5]",
  },
  black: {
    base: "bg-exa-black border border-exa-gray-400 text-white hover:bg-[#1a1a1a] active:bg-[#0a0a0a]",
    iconColor: "text-white",
    selectedIconColor: "text-white",
  },
  primary: {
    base: "bg-exa-black text-white shadow-button-sm w-full justify-center hover:bg-[#1a1a1a] active:bg-[#0a0a0a]",
    iconColor: "text-white",
    selectedIconColor: "text-white",
  },
  secondary: {
    base: "bg-white border border-exa-gray-300 text-exa-gray-900 w-full justify-center hover:bg-[#f9f7f7] hover:border-[rgba(9,114,213,0.32)] active:bg-[#f9f7f7] active:border-[#e5e5e5]",
    iconColor: "text-exa-gray-900",
    selectedIconColor: "text-[#0972d5]",
  },
  ghost: {
    base: "bg-transparent text-black hover:bg-[#f9f7f7] active:bg-[#f0eeee]",
    iconColor: "text-black",
    selectedIconColor: "text-[#0972d5]",
  },
  "ghost-grey": {
    base: "bg-transparent text-exa-gray-600 hover:bg-[#f9f7f7] active:bg-[#f0eeee]",
    iconColor: "text-exa-gray-600",
    selectedIconColor: "text-[#0972d5]",
  },
  "ghost-blue": {
    base: "bg-transparent text-exa-blue hover:bg-[#f9f7f7] active:bg-[#f0eeee]",
    iconColor: "text-exa-blue",
    selectedIconColor: "text-[#0972d5]",
  },
  "ghost-black": {
    base: "bg-transparent text-black hover:bg-[#f9f7f7] active:bg-[#f0eeee]",
    iconColor: "text-black",
    selectedIconColor: "text-[#0972d5]",
  },
};

const sizeStyles = {
  sm: "px-3 py-2 text-sm",
  md: "px-3 py-2.5 text-base",
  lg: "px-8 py-3 text-lg",
};

// Selected state styles (default)
const selectedStyles =
  "bg-[#eef8ff] border border-[#0972d5] text-[#0972d5] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.15),0px_0px_0px_3px_#dbeafe]";

// Selected state styles for black variant (keeps dark background)
const selectedStylesBlack =
  "bg-exa-black border border-exa-gray-400 text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.15),0px_0px_0px_3px_#dbeafe]";

export default function Button({
  children,
  variant = "default",
  size = "md",
  icon: Icon,
  iconOnly = false,
  showCheckIcon = false,
  selected = false, // Selected/active state
  fixedSize = false, // Use fixed 115.2px x 44px dimensions
  className = "",
  ...props
}) {
  const styles = variantStyles[variant] || variantStyles.default;
  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  // Use Check icon only if explicitly requested with showCheckIcon
  const IconComponent = showCheckIcon ? Check : Icon || Edit;
  const showIcon = Icon || iconOnly || showCheckIcon;

  // Fixed size style for consistent button dimensions
  const fixedSizeStyle = fixedSize ? "w-[115.2px] h-[44px] justify-center" : "";

  // Determine selected styles based on variant
  const getSelectedStyles = () => {
    if (variant === "black" || variant === "primary") {
      return selectedStylesBlack;
    }
    return selectedStyles;
  };

  // Determine icon color based on selected state
  const currentIconColor = selected ? styles.selectedIconColor : styles.iconColor;

  return (
    <button
      className={`flex cursor-pointer items-center gap-1 rounded-lg font-medium transition-all duration-200 ${selected ? getSelectedStyles() : styles.base} ${iconOnly ? "p-3" : sizeStyle} ${fixedSizeStyle} ${className} `}
      {...props}
    >
      {showIcon && (
        <span className={`${currentIconColor} ${iconOnly ? "" : ""}`}>
          <IconComponent size={16} />
        </span>
      )}
      {!iconOnly && children && <span>{children}</span>}
    </button>
  );
}

// Convenience exports for specific button types
export function PrimaryButton({ children, ...props }) {
  return (
    <Button variant="primary" size="lg" {...props}>
      {children}
    </Button>
  );
}

export function SecondaryButton({ children, ...props }) {
  return (
    <Button variant="secondary" size="lg" {...props}>
      {children}
    </Button>
  );
}

export function IconButton({ variant = "default", icon, ...props }) {
  return <Button variant={variant} icon={icon} iconOnly {...props} />;
}
