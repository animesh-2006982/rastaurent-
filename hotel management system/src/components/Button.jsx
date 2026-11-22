import React from "react";
import { ChevronRight } from "lucide-react";
import "./site-components.css";

export default function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`public-button public-button-${variant}`}
    >
      <span>{children}</span>
      <ChevronRight size={15} />
    </button>
  );
}
