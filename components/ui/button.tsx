import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary:
    "bg-brand-blue text-white shadow-sm hover:bg-brand-blue/90 focus-visible:ring-brand-blue",
  secondary:
    "bg-brand-surface text-brand-heading border border-brand-border hover:bg-brand-background focus-visible:ring-brand-blue/70",
  outline:
    "border border-brand-border bg-white text-brand-heading hover:bg-brand-background focus-visible:ring-brand-blue/70",
  ghost:
    "text-brand-muted hover:text-brand-heading hover:bg-brand-background focus-visible:ring-brand-blue/60",
  danger:
    "bg-brand-orange text-white hover:bg-brand-orange/90 focus-visible:ring-brand-orange/70",
} as const;

const buttonSizes = {
  md: "h-11 px-5 text-sm",
  sm: "h-9 px-4 text-xs",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60",
          buttonVariants[variant],
          buttonSizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

export default Button;
