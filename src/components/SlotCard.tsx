import { Clock } from "lucide-react";
import { type Slot, formatTime } from "@/mocks/availability";
import { formatCOP, SEDE_ADDRESSES } from "@/mocks/catalog";
import { cn } from "@/lib/utils";

export function SlotCard({ slot, onClick, hidePrice }: { slot: Slot; onClick?: () => void; hidePrice?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-foreground hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2 bg-muted px-4 py-3">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {formatTime(slot.hour, slot.minute)}
        </div>
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-medium bg-background",
            slot.attention === "Telemedicina" && "border-amber-400 text-amber-700",
            slot.attention === "Presencial" && "border-amber-400 text-foreground",
            slot.attention === "Telefónica" && "border-sky-400 text-sky-700",
          )}
        >
          {slot.attention}
        </span>
      </div>
      <div className="p-4">
        <div className="text-sm">
          <div className="text-muted-foreground">Profesional:</div>
          <div className="font-medium">{slot.profesional}</div>
        </div>
        {slot.attention !== "Telemedicina" && slot.attention !== "Telefónica" && (
          <div className="mt-2 text-sm text-muted-foreground">
            <div>{slot.sede}</div>
            <div className="text-xs">{SEDE_ADDRESSES[slot.sede]}</div>
          </div>
        )}
        {!hidePrice && (
          <div className="mt-3 flex justify-end">
            <span className="rounded-md bg-muted px-2 py-1 text-sm font-bold">
              {formatCOP(slot.price)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

