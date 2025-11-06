import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "bg-brand-blue/10 text-brand-blue border border-brand-blue/20",
  success: "bg-brand-green/10 text-brand-green border border-brand-green/20",
  warning: "bg-brand-orange/10 text-brand-orange border border-brand-orange/20",
  slate: "bg-brand-background text-brand-muted border border-brand-border",
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export default Badge;
