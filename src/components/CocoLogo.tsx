import logoUrl from "@/assets/coco-logo.svg";
import { cn } from "@/lib/utils";

export function CocoLogo({ className }: { className?: string }) {
  return <img src={logoUrl} alt="Coco" className={cn("select-none", className)} />;
}
