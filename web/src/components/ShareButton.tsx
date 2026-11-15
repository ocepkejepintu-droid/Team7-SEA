import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Opens the story card sheet. */
export function ShareButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-coral/30 bg-coral-soft text-base font-extrabold text-coral-ink transition active:scale-[0.98]", className)}>
      <Share2 className="size-5" /> {label}
    </button>
  );
}
