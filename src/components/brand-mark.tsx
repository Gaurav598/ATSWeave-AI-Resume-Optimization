import Link from "next/link";
import { Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 text-[15px] font-extrabold tracking-[-.04em] text-foreground", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-[0_10px_24px_-10px_rgba(79,70,229,.8)]" aria-hidden="true">
        <Layers3 className="h-[18px] w-[18px]" strokeWidth={2.4} />
      </span>
      <span>ATS<span className="text-accent">Weave</span></span>
    </Link>
  );
}
