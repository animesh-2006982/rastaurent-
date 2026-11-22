"use client";

import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "soft";
  size?: "sm" | "md" | "lg";
}

export default function Button({ variant = "primary", size = "md", children, className = "", ...props }: ButtonProps) {
  return <button className={`ct-btn ct-btn-${variant} ct-btn-${size} ${className}`} {...props}>{children}</button>;
}
