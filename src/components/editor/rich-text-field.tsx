"use client";

import { useRef } from "react";
import { Bold, Italic, Underline } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  label?: string;
};

/** Textarea with Bold / Italic / Underline — wraps selection in ** * __ markers (LaTeX + live preview). */
export function RichTextField({ value, onChange, placeholder, rows = 4, className, label }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after: string) => {
    const el = ref.current;
    if (!el) {
      onChange(`${before}${value}${after}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || "text";
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + before.length + selected.length + after.length;
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
      void pos;
    });
  };

  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        {label ? <span className="text-xs font-medium text-muted-foreground">{label}</span> : <span />}
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
          <ToolbarBtn title="Bold" onClick={() => wrap("**", "**")}>
            <Bold className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Italic" onClick={() => wrap("*", "*")}>
            <Italic className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Underline" onClick={() => wrap("__", "__")}>
            <Underline className="h-3.5 w-3.5" />
          </ToolbarBtn>
        </div>
      </div>
      <Textarea
        ref={ref}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-[10px] text-muted-foreground">
        Select text, then Bold / Italic / Underline. Tip: <code>**bold**</code> <code>*italic*</code>{" "}
        <code>__underline__</code>
      </p>
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
