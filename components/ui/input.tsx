import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-brand-navy/70 px-4 py-3 text-sm text-brand-white placeholder:text-brand-gray/70 shadow-inner transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy",
          className,
        )}
        {...props}
      />
    );
  },
);

export default Input;
