import { ChevronLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

export function BackButton({ to }: { to?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (to) router.navigate({ to });
        else router.history.back();
      }}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
    >
      <ChevronLeft className="h-4 w-4" />
      Atrás
    </button>
  );
}
