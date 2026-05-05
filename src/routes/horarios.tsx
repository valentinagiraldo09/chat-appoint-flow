import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBooking } from "@/store/booking";
import { filterSlots, generateSlots, parseYmd, type Slot } from "@/mocks/availability";
import { Skeleton } from "@/components/ui/skeleton";
import { FiltersBar } from "@/components/FiltersBar";
import { SlotCard } from "@/components/SlotCard";
import { ConfirmModal } from "@/components/ConfirmModal";
import { BackButton } from "@/components/BackButton";

const search = z.object({ d: z.string().optional(), price: z.coerce.number().optional() });

export const Route = createFileRoute("/horarios")({
  validateSearch: (s) => search.parse(s),
  head: () => ({ meta: [{ title: "Horarios disponibles" }] }),
  component: P2,
});

function P2() {
  const { d } = Route.useSearch();
  const navigate = useNavigate();
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const filters = useBooking((s) => s.filters);
  const [loading, setLoading] = useState(true);
  const [modalSlot, setModalSlot] = useState<Slot | null>(null);

  useEffect(() => {
    if (!specialty || !service) navigate({ to: "/" });
  }, [specialty, service, navigate]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [d, filters.sede, filters.profesional, filters.attention, filters.franja]);

  const date = d ? parseYmd(d) : new Date();
  const allSlotsForDay = useMemo(() => {
    if (!specialty || !service) return [];
    return generateSlots(date, specialty, service);
  }, [date, specialty, service]);
  const slots = useMemo(
    () => filterSlots(allSlotsForDay, filters),
    [allSlotsForDay, filters],
  );

  return (
    <div className="min-h-screen bg-muted/30">
        <div className="border-b border-border bg-muted/60">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="flex items-center gap-4">
              <BackButton />
              <h1 className="text-2xl font-bold capitalize md:text-3xl">
                {format(date, "EEEE d 'de' MMMM", { locale: es })}
              </h1>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <FiltersBar slotPool={allSlotsForDay} />
          <p className="mt-6 text-sm text-muted-foreground capitalize">
            Todos los horarios disponibles para el {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {loading
              ? [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)
              : slots.length === 0
                ? (
                  <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                    No hay horarios con esos filtros.
                  </div>
                )
                : slots.map((s) => <SlotCard key={s.id} slot={s} hidePrice onClick={() => setModalSlot(s)} />)}
          </div>
        </div>

        <ConfirmModal slot={modalSlot} open={!!modalSlot} onOpenChange={(o) => !o && setModalSlot(null)} />
      </div>
  );
}

