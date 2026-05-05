import { Clock, MapPin, Stethoscope, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseYmd, formatTime, type Slot } from "@/mocks/availability";

export function IntentSummary({
  specialty,
  service,
  slot,
  compact = false,
}: {
  specialty?: string;
  service?: string;
  slot: Slot;
  compact?: boolean;
}) {
  const d = parseYmd(slot.date);

  if (compact) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 opacity-60">
        <div className="text-xs text-muted-foreground">
          {specialty}
          {service ? <span> · {service}</span> : null}
        </div>
        <div className="mt-1 text-base font-semibold capitalize text-muted-foreground">
          {format(d, "EEE d MMM", { locale: es })} · {formatTime(slot.hour, slot.minute)}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-2 py-0.5">
            {slot.attention}
          </span>
          <span>{slot.profesional}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Cita que intentabas agendar
      </div>
      <div className="mt-2 text-base font-semibold">
        {specialty}
        {service ? <span className="text-muted-foreground"> · {service}</span> : null}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <div className="flex items-center gap-2 capitalize">
          <CalendarDays className="h-4 w-4" />
          {format(d, "EEEE d 'de' MMMM", { locale: es })}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {formatTime(slot.hour, slot.minute)} · {slot.attention}
        </div>
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4" />
          {slot.profesional}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {slot.sede}
        </div>
      </div>
    </div>
  );
}
