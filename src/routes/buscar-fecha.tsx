import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBooking } from "@/store/booking";
import {
  filterSlots,
  generateSlots,
  parseYmd,
  ymd,
  findNextAvailableDate,
  type Slot,
} from "@/mocks/availability";
import { Skeleton } from "@/components/ui/skeleton";
import { FiltersBar } from "@/components/FiltersBar";
import { SlotCard } from "@/components/SlotCard";
import { ConfirmModal } from "@/components/ConfirmModal";
import { SmartCalendar } from "@/components/SmartCalendar";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/buscar-fecha")({
  head: () => ({ meta: [{ title: "Buscar otra fecha" }] }),
  component: P3,
});

function P3() {
  const navigate = useNavigate();
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const filters = useBooking((s) => s.filters);
  const date = useBooking((s) => s.date);
  const setDate = useBooking((s) => s.setDate);
  const [loading, setLoading] = useState(true);
  const [modalSlot, setModalSlot] = useState<Slot | null>(null);

  useEffect(() => {
    if (!specialty || !service) navigate({ to: "/" });
  }, [specialty, service, navigate]);

  // ensure a default date on entry
  useEffect(() => {
    if (!date && specialty && service) {
      const next = findNextAvailableDate(new Date(), specialty, service);
      if (next) setDate(ymd(next));
    }
  }, [date, specialty, service, setDate]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [date, filters.sede, filters.profesional, filters.attention, filters.franja]);

  const dateObj = date ? parseYmd(date) : new Date();
  const slots = useMemo(() => {
    if (!specialty || !service || !date) return [];
    return filterSlots(generateSlots(dateObj, specialty, service), filters);
  }, [dateObj, specialty, service, filters, date]);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b border-border bg-muted/60">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl font-bold md:text-3xl">Buscar otra fecha</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <FiltersBar />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="mb-3 text-lg font-semibold capitalize">
              {date ? format(dateObj, "EEEE d 'de' MMMM", { locale: es }) : "Selecciona una fecha"}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {loading
                ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)
                : slots.length === 0
                  ? (
                    <div className="col-span-full rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                      No hay horarios con esos filtros para este día.
                    </div>
                  )
                  : slots.map((s) => <SlotCard key={s.id} slot={s} onClick={() => setModalSlot(s)} />)}
            </div>
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <SmartCalendar
              specialty={specialty ?? ""}
              service={service ?? ""}
              value={date}
              onSelect={(d) => setDate(d)}
            />
          </div>
        </div>
      </div>

      <ConfirmModal slot={modalSlot} open={!!modalSlot} onOpenChange={(o) => !o && setModalSlot(null)} />
    </div>
  );
}
