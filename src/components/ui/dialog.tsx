"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        className={cn(
          // Stay inside the viewport on all sizes; scroll instead of cropping.
          "fixed left-1/2 top-[3dvh] z-50 flex max-h-[94dvh] w-[min(96vw,1100px)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl outline-none sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
          className,
        )}
        {...props}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        <DialogPrimitive.Close className="absolute right-3 top-3 z-10 rounded-full bg-card/90 p-2 text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground sm:right-4 sm:top-4">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
