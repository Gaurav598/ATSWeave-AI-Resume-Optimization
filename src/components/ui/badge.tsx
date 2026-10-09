import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: "default" | "outline" | "accent" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        variant === "default" && "bg-muted text-foreground",
        variant === "outline" && "border border-border text-muted-foreground",
        variant === "accent" && "bg-accent/12 text-accent",
        className,
      )}
      {...props}
    />
  );
}
