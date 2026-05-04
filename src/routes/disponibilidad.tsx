import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useBooking } from "@/store/booking";
import { SPECIALTIES, SERVICES, EPS_OPTIONS, type Specialty } from "@/mocks/catalog";
import {
  filterSlots,
  generateSlots,
  parseYmd,
  ymd,
  findNextAvailableDate,
  type Slot,
} from "@/mocks/availability";
import { SmartCalendar } from "@/components/SmartCalendar";
import { FiltersBar } from "@/components/FiltersBar";
import { SlotCard } from "@/components/SlotCard";
import { ConfirmModal } from "@/components/ConfirmModal";
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
  const coverageOnly = useBooking((s) => s.coverageOnly);
  const coverageMinDate = useBooking((s) => s.coverageMinDate);
  const aseguradora = useBooking((s) => s.aseguradora);
  const setCoverageOnly = useBooking((s) => s.setCoverageOnly);
  const setCoverageMinDate = useBooking((s) => s.setCoverageMinDate);

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

  // simulate loader on filter / date / service change
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setLoading(false);
      setTick((x) => x + 1);
    }, 600);
    return () => clearTimeout(t);
  }, [date, filters.sede, filters.profesional, filters.attention, filters.franja, service, coverageOnly, coverageMinDate]);

  const minDate = coverageOnly && coverageMinDate ? parseYmd(coverageMinDate) : null;

  const sections = useMemo(() => {
    if (!specialty || !service) return [];
    if (date) {
      const d = parseYmd(date);
      if (minDate && d < minDate) {
        return [{ title: "", subtitle: format(d, "EEEE d 'de' MMMM", { locale: es }), date: d, slots: [], full: [] }];
      }
      const all = filterSlots(generateSlots(d, specialty, service), filters);
      return [{ title: "", subtitle: format(d, "EEEE d 'de' MMMM", { locale: es }), date: d, slots: all.slice(0, 6), full: all }];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startFrom = minDate && minDate > today ? minDate : today;
    const first = findNextAvailableDate(startFrom, specialty, service) ?? startFrom;
    const second = findNextAvailableDate(new Date(first.getTime() + 24 * 3600 * 1000), specialty, service);
    const out = [];
    const firstSlots = filterSlots(generateSlots(first, specialty, service), filters);
    out.push({
      title: "Lo más pronto disponible",
      subtitle:
        ymd(first) === ymd(today)
          ? `Hoy · ${format(first, "EEEE d 'de' MMMM", { locale: es })}`
          : format(first, "EEEE d 'de' MMMM", { locale: es }),
      date: first,
      slots: firstSlots.slice(0, 3),
      full: firstSlots,
    });
    if (second) {
      const secondSlots = filterSlots(generateSlots(second, specialty, service), filters);
      const isTomorrow = (second.getTime() - today.getTime()) / 86400000 < 2;
      out.push({
        title: isTomorrow ? "Mañana" : "",
        subtitle: format(second, "EEEE d 'de' MMMM", { locale: es }),
        date: second,
        slots: secondSlots.slice(0, 3),
        full: secondSlots,
      });
    }
    return out;
  }, [specialty, service, date, filters, minDate]);

  // Pool of unfiltered slots used to compute cross-filter options.
  const slotPool = useMemo(() => {
    if (!specialty || !service) return [];
    let target: Date | null = null;
    if (date) target = parseYmd(date);
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startFrom = minDate && minDate > today ? minDate : today;
      target = findNextAvailableDate(startFrom, specialty, service);
    }
    if (!target) return [];
    return generateSlots(target, specialty, service);
  }, [specialty, service, date, minDate]);

  function clearCoverageFilter() {
    setCoverageOnly(false);
    setCoverageMinDate(undefined);
  }

  return (
    <div className="min-h-screen bg-muted/30">

      <div className="border-b border-border bg-muted/60">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-5 flex items-center gap-4">
            <BackButton to="/" />
            <h1 className="text-2xl font-bold md:text-3xl">¿Qué cita quieres?</h1>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-background p-2 shadow-sm md:flex-row">
            <div className="flex-1">
              <AseguradoraPicker />
            </div>
            <div className="flex-1">
              <ServicePicker />
            </div>
            <div className="flex-1">
              <DatePickerField />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background hover:bg-foreground/90">
              <Search className="h-4 w-4" /> Buscar
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <FiltersBar slotPool={slotPool} />

        {coverageOnly && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800">
            <Star className="h-3 w-3" />
            Solo cubiertas por {aseguradora ?? "tu aseguradora"}
            {coverageMinDate && (
              <span className="text-emerald-700">
                · desde {format(parseYmd(coverageMinDate), "MMM yyyy", { locale: es })}
              </span>
            )}
            <button
              onClick={clearCoverageFilter}
              className="ml-1 rounded-full bg-emerald-200/60 px-1.5 py-0.5 text-[10px] hover:bg-emerald-200"
            >
              Quitar
            </button>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {loading
            ? [0, 1].map((i) => (
                <div key={i}>
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {[0, 1, 2].map((j) => (
                      <Skeleton key={j} className="h-44 rounded-xl" />
                    ))}
                  </div>
                </div>
              ))
            : sections.map((sec, i) => (
                <section key={i}>
                  <div className="rounded-t-xl bg-emerald-100/70 px-5 py-3">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      {sec.title && <Star className="h-4 w-4 fill-foreground" />}
                      {sec.title && <span>{sec.title}</span>}
                      <span className="text-muted-foreground capitalize">
                        {sec.title ? `   ${sec.subtitle}` : sec.subtitle}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-b-xl border border-t-0 border-border bg-background p-4">
                    {sec.slots.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No hay horarios con esos filtros para este día.
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-3">
                        {sec.slots.map((slot) => (
                          <SlotCard key={slot.id} slot={slot} onClick={() => setModalSlot(slot)} />
                        ))}
                      </div>
                    )}
                    {sec.full.length > sec.slots.length && (
                      <div className="mt-3 flex justify-end">
                        <Link
                          to="/horarios"
                          search={{ d: ymd(sec.date) }}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Ver más
                        </Link>
                      </div>
                    )}
                  </div>
                </section>
              ))}

        </div>
      </div>

      <ConfirmModal slot={modalSlot} open={!!modalSlot} onOpenChange={(o) => !o && setModalSlot(null)} />
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
