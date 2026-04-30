import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Loader2, Clock, MapPin, Stethoscope } from "lucide-react";
import { useBooking } from "@/store/booking";
import {
  findNextAvailableDate,
  generateSlots,
  parseYmd,
  ymd,
  formatTime,
  type Slot,
} from "@/mocks/availability";
import { formatCOP } from "@/mocks/catalog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/oportunidad")({
  head: () => ({ meta: [{ title: "Oportunidad de cita" }] }),
  component: P5,
});

function P5() {
  const navigate = useNavigate();
  const slot = useBooking((s) => s.selectedSlot);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const coverage = useBooking((s) => s.coverage);
  const acceptedSuggested = useBooking((s) => s.acceptedSuggestedDate);
  const setSelectedSlot = useBooking((s) => s.setSelectedSlot);

  const [loading, setLoading] = useState(true);
  const [opportunity, setOpportunity] = useState<Slot | null>(null);
  const [chosen, setChosen] = useState<"current" | "opportunity">("current");

  // Si aceptó la sugerida del banner de cobertura, ya cambiamos el slot
  useEffect(() => {
    if (!slot || !specialty || !service) {
      navigate({ to: "/" });
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      // Buscar oportunidad: el primer día disponible ANTES del slot actual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const slotDate = parseYmd(slot.date);
      let candidate: Slot | null = null;
      const cur = new Date(today);
      while (cur < slotDate) {
        const ds = generateSlots(cur, specialty, service);
        if (ds.length > 0) {
          candidate = ds[0];
          break;
        }
        cur.setDate(cur.getDate() + 1);
      }
      setOpportunity(candidate);
      setLoading(false);
    }, 900);
    return () => clearTimeout(t);
  }, [slot, specialty, service, navigate]);

  if (!slot) return null;

  function continueWith(which: "current" | "opportunity") {
    setChosen(which);
    if (which === "opportunity" && opportunity) {
      setSelectedSlot(opportunity);
    }
    setTimeout(() => navigate({ to: "/pago" }), 150);
  }

  const slotDate = parseYmd(slot.date);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BackButton />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="text-3xl font-bold">Antes de continuar...</h1>
        <p className="mt-2 text-muted-foreground">
          Estamos buscando si hay una cita disponible más pronto que la que elegiste.
        </p>

        {acceptedSuggested && coverage?.case === 2 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Tomaste la fecha sugerida por tu aseguradora. Igualmente revisamos si hay una mejor oportunidad.
          </div>
        )}

        {loading ? (
          <div className="mt-10 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Buscando oportunidades disponibles...
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {opportunity && (
              <SlotOptionCard
                title="Oportunidad disponible"
                badge={<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"><Sparkles className="h-3 w-3" /> Más pronto</span>}
                slot={opportunity}
                selected={chosen === "opportunity"}
                onSelect={() => continueWith("opportunity")}
              />
            )}
            <SlotOptionCard
              title="Tu cita seleccionada"
              slot={slot}
              dateLabel={format(slotDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              selected={chosen === "current"}
              onSelect={() => continueWith("current")}
            />
            {!opportunity && (
              <div className="rounded-xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground md:col-span-2">
                No encontramos una cita más pronta. Puedes continuar con la que ya tienes seleccionada.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SlotOptionCard({
  title,
  badge,
  slot,
  dateLabel,
  selected,
  onSelect,
}: {
  title: string;
  badge?: React.ReactNode;
  slot: Slot;
  dateLabel?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const d = parseYmd(slot.date);
  return (
    <div
      className={
        "rounded-2xl border bg-card p-5 transition-all " +
        (selected ? "border-foreground shadow-md" : "border-border hover:border-foreground/40")
      }
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {badge}
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="capitalize text-base font-medium">
          {dateLabel ?? format(d, "EEEE d 'de' MMMM", { locale: es })}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" /> {formatTime(slot.hour, slot.minute)}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Stethoscope className="h-4 w-4" /> {slot.profesional}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" /> {slot.sede}
        </div>
        <div className="pt-2 text-base font-semibold">{formatCOP(slot.price)}</div>
      </div>
      <Button
        onClick={onSelect}
        className="mt-4 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
      >
        Continuar con esta cita
      </Button>
    </div>
  );
}
