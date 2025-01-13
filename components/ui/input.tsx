import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // base
          "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          // light mode
          "border-neutral-200 file:text-neutral-950 focus-visible:ring-brand-600",
          // dark mode
          "dark:border-neutral-700 dark:file:text-neutral-50 dark:placeholder:text-neutral-400 dark:focus-visible:ring-brand-600",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
