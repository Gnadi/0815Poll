import { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary-50 text-primary",
  success: "bg-emerald-50 text-success",
  outline: "bg-transparent border border-border text-text-secondary",
};

export default function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5
        text-xs font-medium leading-tight
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
