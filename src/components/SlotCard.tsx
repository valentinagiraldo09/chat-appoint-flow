import { Clock } from "lucide-react";
import { type Slot, formatTime } from "@/mocks/availability";
import { formatCOP, SEDE_ADDRESSES } from "@/mocks/catalog";
import { cn } from "@/lib/utils";

export function SlotCard({ slot, onClick }: { slot: Slot; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-xl border border-border bg-card p-4 text-left transition hover:border-foreground hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {formatTime(slot.hour, slot.minute)}
        </div>
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-medium",
            slot.attention === "Telemedicina" && "border-amber-400 text-amber-700 bg-amber-50",
            slot.attention === "Presencial" && "border-emerald-400 text-emerald-700 bg-emerald-50",
            slot.attention === "Telefónica" && "border-sky-400 text-sky-700 bg-sky-50",
          )}
        >
          {slot.attention}
        </span>
      </div>
      <div className="mt-3 text-sm">
        <div className="text-muted-foreground">Profesional:</div>
        <div className="font-medium">{slot.profesional}</div>
      </div>
      {slot.attention !== "Telemedicina" && slot.attention !== "Telefónica" && (
        <div className="mt-2 text-sm text-muted-foreground">
          <div>{slot.sede}</div>
          <div className="text-xs">{SEDE_ADDRESSES[slot.sede]}</div>
        </div>
      )}
      <div className="mt-3 flex justify-end">
        <span className="rounded-md bg-muted px-2 py-1 text-sm font-bold">
          {formatCOP(slot.price)}
        </span>
      </div>
    </button>
  );
}
