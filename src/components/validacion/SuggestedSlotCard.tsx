import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Stethoscope, MapPin, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseYmd, formatTime, type Slot } from "@/mocks/availability";
import { formatCOP } from "@/mocks/catalog";

export function SuggestedSlotCard({
  slot,
  eyebrow = "Sugerido para ti",
  ctaLabel = "Tomar esta cita",
  onSelect,
  secondaryLabel,
  onSecondary,
}: {
  slot: Slot;
  eyebrow?: string;
  ctaLabel?: string;
  onSelect: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const d = parseYmd(slot.date);
  return (
    <div className="rounded-2xl border-2 border-foreground/10 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <div className="mt-2 text-lg font-semibold capitalize">
        {format(d, "EEEE d 'de' MMMM", { locale: es })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {formatTime(slot.hour, slot.minute)}
        </span>
        <span className="flex items-center gap-1.5">
          <Stethoscope className="h-4 w-4" /> {slot.profesional}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> {slot.sede}
        </span>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Particular
        </span>
        <span className="text-xl font-bold">{formatCOP(slot.price)}</span>
      </div>
      <Button
        onClick={onSelect}
        className="mt-4 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        {ctaLabel}
      </Button>
    </div>
  );
}
