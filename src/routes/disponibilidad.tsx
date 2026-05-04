import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, Zap, AlertTriangle, CalendarX } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/store/booking";
import { SPECIALTIES, SERVICES, EPS_OPTIONS, type Specialty } from "@/mocks/catalog";
import {
  filterSlots,
  generateSlots,
  parseYmd,
  findNextAvailableDate,
  type Slot,
} from "@/mocks/availability";

// Pick up to 3 slots spread across morning / midday / afternoon
function spreadSlots(all: Slot[]): Slot[] {
  if (all.length <= 3) return all;
  const morning = all.filter((s) => s.hour < 12);
  const midday = all.filter((s) => s.hour >= 12 && s.hour < 15);
  const afternoon = all.filter((s) => s.hour >= 15);
  const buckets = [morning, midday, afternoon];
  const picked: Slot[] = [];
  const pickedIds = new Set<string>();
  for (const b of buckets) {
    const choice = b[Math.floor(b.length / 2)] ?? b[0];
    if (choice && !pickedIds.has(choice.id)) {
      picked.push(choice);
      pickedIds.add(choice.id);
    }
  }
  // Fill remaining from any bucket if some were empty
  for (const s of all) {
    if (picked.length >= 3) break;
    if (!pickedIds.has(s.id)) {
      picked.push(s);
      pickedIds.add(s.id);
    }
  }
  return picked.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}
import { getEstadoDisponibilidad } from "@/mocks/disponibilidadStates";
import { SmartCalendar } from "@/components/SmartCalendar";
import { FiltersBar } from "@/components/FiltersBar";
import { SlotCard } from "@/components/SlotCard";
import { ConfirmModal } from "@/components/ConfirmModal";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { BackButton } from "@/components/BackButton";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/disponibilidad")({
  head: () => ({
    meta: [{ title: "Disponibilidad — Citas médicas" }],
  }),
  component: P1,
});

function ServicePicker() {
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const setSpecialty = useBooking((s) => s.setSpecialty);
  const setService = useBooking((s) => s.setService);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<Specialty | null>(specialty as Specialty | null);

  const label = specialty
    ? service
      ? `${specialty} — ${service}`
      : specialty
    : "Selecciona servicio";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-full border border-border bg-background px-4 py-3 text-left text-sm font-medium hover:border-foreground">
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[420px] p-0">
        <div className="flex">
          <div className="w-1/2 border-r border-border p-2">
            {SPECIALTIES.map((sp) => (
              <button
                key={sp}
                onMouseEnter={() => setHover(sp)}
                onClick={() => setHover(sp)}
                className={cn(
                  "block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted",
                  hover === sp && "bg-muted font-semibold",
                )}
              >
                {sp}
              </button>
            ))}
          </div>
          <div className="w-1/2 p-2">
            {hover &&
              SERVICES[hover].map((sv) => (
                <button
                  key={sv}
                  onClick={() => {
                    setSpecialty(hover);
                    setService(sv);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted",
                    specialty === hover && service === sv && "bg-emerald-50 font-semibold text-emerald-700",
                  )}
                >
                  {sv}
                </button>
              ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DatePickerField() {
  const date = useBooking((s) => s.date);
  const setDate = useBooking((s) => s.setDate);
  const specialty = useBooking((s) => s.specialty) ?? "";
  const service = useBooking((s) => s.service) ?? "";
  const [open, setOpen] = useState(false);
  const label = date
    ? format(parseYmd(date), "EEEE d 'de' MMMM", { locale: es })
    : "Lo más pronto";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-full border border-border bg-background px-4 py-3 text-left text-sm font-medium capitalize hover:border-foreground">
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto border-none bg-transparent p-0 shadow-none">
        <SmartCalendar
          specialty={specialty}
          service={service}
          value={date}
          onSelect={(d) => {
            setDate(d);
            setOpen(false);
          }}
          onClear={() => {
            setDate(undefined);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function P1() {
  const navigate = useNavigate();
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const date = useBooking((s) => s.date);
  const filters = useBooking((s) => s.filters);
  const setService = useBooking((s) => s.setService);
  const aseguradora = useBooking((s) => s.aseguradora);

  // Default service if none picked
  useEffect(() => {
    if (specialty && !service) {
      const opts = SERVICES[specialty as Specialty];
      if (opts) setService(opts[0]);
    }
  }, [specialty, service, setService]);

  // Redirect to home if no specialty
  useEffect(() => {
    if (!specialty) navigate({ to: "/" });
  }, [specialty, navigate]);

  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);
  const [modalSlot, setModalSlot] = useState<Slot | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const estado = getEstadoDisponibilidad(specialty, aseguradora);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setLoading(false);
      setTick((x) => x + 1);
    }, 500);
    return () => clearTimeout(t);
  }, [date, filters.sede, filters.profesional, filters.attention, filters.franja, service, estado]);

  // EPS slots: artificially pushed further in the future for estado-2
  const epsSection = useMemo(() => {
    if (!specialty || !service) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startFrom = date
      ? parseYmd(date)
      : estado === "estado-2"
        ? new Date(today.getTime() + 10 * 86400000)
        : today;
    const first = findNextAvailableDate(startFrom, specialty, service) ?? startFrom;
    const all = filterSlots(generateSlots(first, specialty, service), filters);
    return { date: first, slots: spreadSlots(all), full: all };
  }, [specialty, service, date, filters, estado]);

  // Following day section (only for estado-1): next available date after epsSection
  const nextSection = useMemo(() => {
    if (estado !== "estado-1" || !epsSection || !specialty || !service) return null;
    const after = new Date(epsSection.date);
    after.setDate(after.getDate() + 1);
    const next = findNextAvailableDate(after, specialty, service);
    if (!next) return null;
    const all = filterSlots(generateSlots(next, specialty, service), filters);
    if (all.length === 0) return null;
    return { date: next, slots: spreadSlots(all), full: all };
  }, [estado, epsSection, specialty, service, filters]);

  // Particular nearer slot for estado-2
  const particularSection = useMemo(() => {
    if (!specialty || !service) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const first = findNextAvailableDate(today, specialty, service) ?? today;
    const all = filterSlots(generateSlots(first, specialty, service), filters);
    return { date: first, slots: all.slice(0, 1), full: all };
  }, [specialty, service, filters]);

  // Build a wider slot pool (next 30 days from epsSection) so filter dropdowns
  // can cross-restrict (sede ↔ profesional ↔ atención ↔ franja) consistently.
  const slotPool = useMemo(() => {
    if (!epsSection || !specialty || !service) return [];
    const pool: Slot[] = [];
    const start = new Date(epsSection.date);
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      pool.push(...generateSlots(d, specialty, service));
    }
    return pool;
  }, [epsSection, specialty, service]);

  const showFilters = estado !== "estado-4";

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b border-border bg-muted/60">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-5 flex items-center gap-4">
            <BackButton to="/" />
            <h1 className="text-2xl font-bold md:text-3xl">¿Qué cita quieres?</h1>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-background p-2 shadow-sm md:flex-row">
            <div className="flex-1"><AseguradoraPicker /></div>
            <div className="flex-1"><ServicePicker /></div>
            <div className="flex-1"><DatePickerField /></div>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background hover:bg-foreground/90">
              <Search className="h-4 w-4" /> Buscar
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {estado === "estado-3" && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#FFA800] bg-[#FFF6E5] p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#B36B00]" />
            <div>
              Tu aseguradora no tiene cobertura para este servicio en este centro.
              Te mostramos la disponibilidad disponible.
            </div>
          </div>
        )}

        {showFilters && <FiltersBar slotPool={slotPool} />}

        <div className="mt-6 space-y-6">
          {loading ? (
            <div>
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((j) => <Skeleton key={j} className="h-44 rounded-xl" />)}
              </div>
            </div>
          ) : estado === "estado-4" ? (
            <EmptyState
              specialty={specialty}
              aseguradora={aseguradora}
              onWaitlist={() => setWaitlistOpen(true)}
            />
          ) : (
            <>
              {epsSection && (
                <SectionCard
                  label={!date ? "Lo más pronto disponible" : undefined}
                  date={epsSection.date}
                  slots={epsSection.slots}
                  full={epsSection.full}
                  hidePrice={estado === "estado-1" || estado === "estado-2"}
                  onSelect={setModalSlot}
                />
              )}

              {estado === "estado-1" && nextSection && (
                <SectionCard
                  date={nextSection.date}
                  slots={nextSection.slots}
                  full={nextSection.full}
                  hidePrice
                  onSelect={setModalSlot}
                />
              )}

              {estado === "estado-2" && particularSection && particularSection.slots.length > 0 && (
                <div className="rounded-xl border-2 border-[#FFA800] bg-[#FFFBEF] p-5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#B36B00]" />
                    <div>
                      <div className="font-semibold">¿Quieres una cita antes?</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        Disponibilidad particular el{" "}
                        {format(particularSection.date, "EEEE d 'de' MMMM", { locale: es })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {particularSection.slots.map((slot) => (
                      <SlotCard key={slot.id} slot={slot} onClick={() => setModalSlot(slot)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmModal slot={modalSlot} open={!!modalSlot} onOpenChange={(o) => !o && setModalSlot(null)} />
      <WaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        specialty={specialty}
        aseguradora={aseguradora}
      />
    </div>
  );
}

function SectionCard({
  label,
  date,
  slots,
  full,
  hidePrice,
  onSelect,
}: {
  label?: string;
  date: Date;
  slots: Slot[];
  full: Slot[];
  hidePrice?: boolean;
  onSelect: (s: Slot) => void;
}) {
  return (
    <section>
      <div className="rounded-t-xl bg-emerald-100/70 px-5 py-3">
        <div className="flex items-center gap-2 text-base font-semibold capitalize">
          {label && <span className="capitalize-none">{label} · </span>}
          <span>{format(date, "EEEE d 'de' MMMM", { locale: es })}</span>
        </div>
      </div>
      <div className="rounded-b-xl border border-t-0 border-border bg-background p-4">
        {slots.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No hay horarios con esos filtros para este día.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {slots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} hidePrice={hidePrice} onClick={() => onSelect(slot)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState({
  specialty,
  aseguradora,
  onWaitlist,
}: {
  specialty?: string;
  aseguradora?: string;
  onWaitlist: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-12 text-center">
      <CalendarX className="mx-auto h-12 w-12" strokeWidth={1.5} style={{ color: "#B7B7B7" }} />
      <h3 className="mt-4 text-xl font-semibold">No encontramos disponibilidad</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        No hay citas disponibles para {specialty} con {aseguradora} en este momento.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={onWaitlist} className="rounded-full">
          Inscribirme en lista de espera
        </Button>
      </div>
    </div>
  );
}

function AseguradoraPicker() {
  const aseguradora = useBooking((s) => s.aseguradora);
  const setAseguradora = useBooking((s) => s.setAseguradora);
  const [open, setOpen] = useState(false);
  const label = aseguradora ?? "Selecciona aseguradora";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-full border border-border bg-background px-4 py-3 text-left text-sm font-medium hover:border-foreground">
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] p-2">
        {EPS_OPTIONS.map((eps) => (
          <button
            key={eps}
            onClick={() => {
              setAseguradora(eps);
              setOpen(false);
            }}
            className={cn(
              "block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted",
              aseguradora === eps && "bg-emerald-50 font-semibold text-emerald-700",
            )}
          >
            {eps}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
