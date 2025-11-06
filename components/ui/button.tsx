import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary:
    "bg-brand-blue text-brand-white hover:bg-brand-blue/90 focus-visible:ring-brand-blue",
  secondary:
    "bg-brand-slate text-brand-white hover:bg-brand-slate/80 focus-visible:ring-brand-blue/70",
  outline:
    "border border-brand-gray text-brand-white hover:bg-brand-slate/40 focus-visible:ring-brand-blue/70",
  ghost:
    "text-brand-gray hover:text-brand-white hover:bg-brand-slate/30 focus-visible:ring-brand-blue/70",
  danger:
    "bg-brand-orange text-brand-white hover:bg-brand-orange/90 focus-visible:ring-brand-orange/70",
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
          "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy disabled:cursor-not-allowed disabled:opacity-60",
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
