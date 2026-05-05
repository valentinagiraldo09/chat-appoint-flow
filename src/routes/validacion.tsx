import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Phone,
  CreditCard,
  CalendarSearch,
  ListChecks,
  Clock,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBooking } from "@/store/booking";
import {
  parseYmd,
  formatTime,
  generateSlots,
  findNextAvailableDate,
  type Slot,
} from "@/mocks/availability";
import { formatCOP } from "@/mocks/catalog";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { WaitlistDialog } from "@/components/WaitlistDialog";

export const Route = createFileRoute("/validacion")({
  head: () => ({ meta: [{ title: "Resultado de validaciones" }] }),
  component: P5,
});

function findParticularSlot(
  specialty?: string,
  service?: string,
  fromDate?: Date,
): Slot | null {
  if (!specialty || !service) return null;
  const start = fromDate ? new Date(fromDate) : new Date();
  start.setHours(0, 0, 0, 0);
  const next = findNextAvailableDate(start, specialty, service);
  if (!next) return null;
  const slots = generateSlots(next, specialty, service);
  return slots[0] ?? null;
}

function P5() {
  const navigate = useNavigate();
  const result = useBooking((s) => s.validationResult);
  const slot = useBooking((s) => s.selectedSlot);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const aseguradora = useBooking((s) => s.aseguradora);
  const setSelectedSlot = useBooking((s) => s.setSelectedSlot);
  const setPayParticularOverride = useBooking((s) => s.setPayParticularOverride);
  const setCoverageOnly = useBooking((s) => s.setCoverageOnly);
  const setCoverageMinDate = useBooking((s) => s.setCoverageMinDate);
  const setDate = useBooking((s) => s.setDate);

  const [waitlistOpen, setWaitlistOpen] = useState(false);

  useEffect(() => {
    if (!result || !slot) navigate({ to: "/" });
  }, [result, slot, navigate]);

  const particularSlot = useMemo(
    () => findParticularSlot(specialty, service),
    [specialty, service],
  );

  if (!result || !slot) return null;

  function goPago() {
    navigate({ to: "/pago" });
  }

  function tomarSlotActualParticular() {
    setPayParticularOverride(true);
    goPago();
  }

  function tomarSugeridoParticular(s: Slot) {
    setSelectedSlot(s);
    setPayParticularOverride(true);
    goPago();
  }

  function verMasParticulares() {
    setSelectedSlot(undefined);
    setPayParticularOverride(true);
    setCoverageOnly(false);
    navigate({ to: "/disponibilidad" });
  }

  function verConAseguradora(minDate?: string) {
    setSelectedSlot(undefined);
    setPayParticularOverride(false);
    setCoverageOnly(true);
    if (minDate) {
      setCoverageMinDate(minDate);
      setDate(minDate);
    } else {
      setCoverageMinDate(undefined);
    }
    navigate({ to: "/disponibilidad" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BackButton />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        {result.kind === "ok" && <OkView onConfirm={goPago} />}

        {result.kind === "limite_paciente" && (
          <LimiteView
            fechaPermitida={result.fechaPermitida}
            particularSlot={particularSlot}
            onVerAseguradora={() => verConAseguradora(result.fechaPermitida)}
            onTomarSugerido={tomarSugeridoParticular}
            onVerMasParticulares={verMasParticulares}
          />
        )}

        {result.kind === "lista_negra" && (
          <ListaNegraView
            telefono={result.telefonoEPS}
            slot={slot}
            onTomarParticular={tomarSlotActualParticular}
            onVerMasParticulares={verMasParticulares}
          />
        )}

        {result.kind === "sin_cobertura" && (
          <SinCoberturaView
            particularSlot={particularSlot}
            onTomarSugerido={tomarSugeridoParticular}
            onVerAseguradora={() => verConAseguradora()}
            onListaEspera={() => setWaitlistOpen(true)}
          />
        )}

        {result.kind === "sin_disponibilidad" && (
          <SinDisponibilidadView onListaEspera={() => setWaitlistOpen(true)} />
        )}
      </div>

      <WaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        specialty={specialty}
        aseguradora={aseguradora}
      />
    </div>
  );
}

// -------------------- Sub-vistas --------------------

function OkView({ onConfirm }: { onConfirm: () => void }) {
  return (
    <>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">
              Tu cita aplica por tu aseguradora
            </h1>
            <p className="mt-1 text-emerald-800">
              Verificamos tu cobertura y todo está en orden. Puedes confirmar tu cita.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          onClick={onConfirm}
          className="rounded-full bg-foreground px-8 text-background hover:bg-foreground/90"
        >
          Confirmar cita
        </Button>
      </div>
    </>
  );
}

function LimiteView({
  fechaPermitida,
  particularSlot,
  onVerAseguradora,
  onTomarSugerido,
  onVerMasParticulares,
}: {
  fechaPermitida: string;
  particularSlot: Slot | null;
  onVerAseguradora: () => void;
  onTomarSugerido: (s: Slot) => void;
  onVerMasParticulares: () => void;
}) {
  const fecha = parseYmd(fechaPermitida);
  const fechaLabel = format(fecha, "d 'de' MMMM 'de' yyyy", { locale: es });
  return (
    <>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold text-amber-900">
              Tu aseguradora no permite agendar este servicio en esta fecha
            </h1>
            <p className="mt-1 capitalize text-amber-900/90">
              Puedes hacerlo desde el {fechaLabel}.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <button
          onClick={onVerAseguradora}
          className="rounded-2xl border border-border bg-card p-5 text-left transition hover:border-foreground/60 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-emerald-700">
            <CalendarSearch className="h-5 w-5" />
            <span className="text-sm font-medium">Recomendado</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold">
            Ver opciones con mi aseguradora
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Disponibilidad cubierta a partir del {fechaLabel}.
          </p>
          <span className="mt-4 inline-block rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
            Ver disponibilidad
          </span>
        </button>

        {particularSlot ? (
          <ParticularSlotCard
            slot={particularSlot}
            title="Tomar una cita particular"
            onSelect={() => onTomarSugerido(particularSlot)}
          />
        ) : (
          <div className="rounded-2xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
            No encontramos un horario particular cercano.
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={onVerMasParticulares}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Ver más opciones particulares
        </button>
      </div>
    </>
  );
}

function ListaNegraView({
  telefono,
  slot,
  onTomarParticular,
  onVerMasParticulares,
}: {
  telefono: string;
  slot: Slot;
  onTomarParticular: () => void;
  onVerMasParticulares: () => void;
}) {
  return (
    <>
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-6 w-6 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-red-900">
              Tu aseguradora no tiene cobertura con nosotros
            </h1>
            <p className="mt-1 text-red-800">
              Comunícate con ellos al{" "}
              <a href={`tel:${telefono.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 font-semibold underline">
                <Phone className="h-4 w-4" /> {telefono}
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Puedes tomar esta cita como particular
        </h2>
        <SlotMeta slot={slot} />
        <Button
          onClick={onTomarParticular}
          className="mt-4 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Tomar esta cita como particular por {formatCOP(slot.price)}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={onVerMasParticulares}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Ver más opciones particulares
        </button>
      </div>
    </>
  );
}

function SinCoberturaView({
  particularSlot,
  onTomarSugerido,
  onVerAseguradora,
  onListaEspera,
}: {
  particularSlot: Slot | null;
  onTomarSugerido: (s: Slot) => void;
  onVerAseguradora: () => void;
  onListaEspera: () => void;
}) {
  return (
    <>
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-6 w-6 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-red-900">
              Este servicio no está cubierto por tu aseguradora
            </h1>
            <p className="mt-1 text-red-800">
              Te mostramos opciones particulares y disponibilidad cubierta para otros servicios.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {particularSlot ? (
          <ParticularSlotCard
            slot={particularSlot}
            title="Cita particular sugerida"
            onSelect={() => onTomarSugerido(particularSlot)}
          />
        ) : (
          <div className="rounded-2xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
            No encontramos un horario particular cercano.
          </div>
        )}

        <button
          onClick={onVerAseguradora}
          className="rounded-2xl border border-border bg-card p-5 text-left transition hover:border-foreground/60 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-emerald-700">
            <CalendarSearch className="h-5 w-5" />
            <span className="text-sm font-medium">Cobertura</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold">
            Ver disponibilidad con mi aseguradora
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo servicios y horarios cubiertos.
          </p>
          <span className="mt-4 inline-block rounded-full border border-foreground bg-background px-4 py-2 text-sm font-medium">
            Ver disponibilidad cubierta
          </span>
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={onListaEspera}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground underline hover:text-foreground"
        >
          <ListChecks className="h-4 w-4" /> Inscribirme en lista de espera
        </button>
      </div>
    </>
  );
}

function SinDisponibilidadView({ onListaEspera }: { onListaEspera: () => void }) {
  return (
    <>
      <div className="rounded-2xl border border-border bg-muted/30 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">
              No encontramos disponibilidad en este momento
            </h1>
            <p className="mt-1 text-muted-foreground">
              Inscríbete en la lista de espera y te avisamos cuando se libere un horario.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          onClick={onListaEspera}
          className="rounded-full bg-foreground px-8 text-background hover:bg-foreground/90"
        >
          <ListChecks className="mr-2 h-4 w-4" /> Inscribirme en lista de espera
        </Button>
      </div>
    </>
  );
}

// -------------------- Helpers UI --------------------

function ParticularSlotCard({
  slot,
  title,
  onSelect,
}: {
  slot: Slot;
  title: string;
  onSelect: () => void;
}) {
  const d = parseYmd(slot.date);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <CreditCard className="h-5 w-5" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <h3 className="mt-2 text-lg font-semibold capitalize">
        {format(d, "EEEE d 'de' MMMM", { locale: es })}
      </h3>
      <SlotMeta slot={slot} hideDate />
      <div className="mt-3 text-base font-semibold">{formatCOP(slot.price)}</div>
      <Button
        onClick={onSelect}
        className="mt-4 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
      >
        Tomar esta cita particular
      </Button>
    </div>
  );
}

function SlotMeta({ slot, hideDate }: { slot: Slot; hideDate?: boolean }) {
  const d = parseYmd(slot.date);
  return (
    <div className="mt-3 space-y-2 text-sm">
      {!hideDate && (
        <div className="capitalize text-base font-medium">
          {format(d, "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </div>
      )}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" /> {formatTime(slot.hour, slot.minute)} · {slot.attention}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Stethoscope className="h-4 w-4" /> {slot.profesional}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4" /> {slot.sede}
      </div>
    </div>
  );
}

