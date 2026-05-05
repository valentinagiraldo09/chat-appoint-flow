import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResultTone = "success" | "warning" | "info" | "blocked" | "neutral";

const toneStyles: Record<ResultTone, string> = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-sky-100 text-sky-700",
  blocked: "bg-rose-100 text-rose-700",
  neutral: "bg-muted text-muted-foreground",
};

export function ResultHeader({
  icon: Icon,
  tone,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  tone: ResultTone;
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          toneStyles[tone],
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
