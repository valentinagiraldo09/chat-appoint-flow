import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  CalendarDays,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBooking } from "@/store/booking";
import {
  parseYmd,
  ymd,
  generateSlots,
  findNextAvailableDate,
  type Slot,
} from "@/mocks/availability";
import { BackButton } from "@/components/BackButton";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { ResultHeader } from "@/components/validacion/ResultHeader";
import { IntentSummary } from "@/components/validacion/IntentSummary";
import {
  PrimaryAction,
  SecondaryActions,
  SecondaryActionRow,
} from "@/components/validacion/ActionList";

import { SuggestedSlotCard } from "@/components/validacion/SuggestedSlotCard";

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
  if (fromDate) {
    const sameDay = generateSlots(start, specialty, service);
    if (sameDay.length > 0) return sameDay[0];
  }
  const next = findNextAvailableDate(start, specialty, service);
  if (!next) return null;
  const slots = generateSlots(next, specialty, service).map((slot) =>
    fromDate
      ? {
          ...slot,
          id: `${ymd(start)}-particular-${slot.hour}-${slot.minute}`,
          date: ymd(start),
        }
      : slot,
  );
  return slots[0] ?? null;
}

function P5() {
  const navigate = useNavigate();
  const result = useBooking((s) => s.validationResult);
  const slot = useBooking((s) => s.selectedSlot);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const aseguradora = useBooking((s) => s.aseguradora);
  const date = useBooking((s) => s.date);
  const preferredDate = useBooking((s) => s.preferredDate);
  const setSelectedSlot = useBooking((s) => s.setSelectedSlot);
  const setPayParticularOverride = useBooking((s) => s.setPayParticularOverride);
  const setCoverageOnly = useBooking((s) => s.setCoverageOnly);
  const setCoverageMinDate = useBooking((s) => s.setCoverageMinDate);
  const setDate = useBooking((s) => s.setDate);
  const setAseguradora = useBooking((s) => s.setAseguradora);
  const setPreviousAseguradora = useBooking((s) => s.setPreviousAseguradora);
  const reset = useBooking((s) => s.reset);

  const [waitlistOpen, setWaitlistOpen] = useState(false);

  useEffect(() => {
    if (!result) navigate({ to: "/" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const particularSlot = useMemo(
    () => {
      const targetDate = preferredDate ?? date;
      return findParticularSlot(specialty, service, targetDate ? parseYmd(targetDate) : undefined);
    },
    [specialty, service, preferredDate, date],
  );

  const setPaymentMethod = useBooking((s) => s.setPaymentMethod);
  const setConfirmationCode = useBooking((s) => s.setConfirmationCode);

  if (!result || !slot) return null;


  const goConfirmacion = (method: "clinic" | "none") => {
    setPaymentMethod(method);
    const code = "CIT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setConfirmationCode(code);
    navigate({ to: "/confirmacion" });
  };

  const goPago = () => {
    const hasAmount = (slot.price ?? 0) > 0;
    goConfirmacion(hasAmount ? "clinic" : "none");
  };

  const tomarSlotActualParticular = () => {
    setPayParticularOverride(true);
    goConfirmacion("clinic");
  };

  const tomarSugeridoParticular = (s: Slot) => {
    setSelectedSlot(s);
    setPayParticularOverride(true);
    goConfirmacion("clinic");
  };


  const verMasParticulares = () => {
    if (aseguradora && aseguradora !== "Particular") {
      setPreviousAseguradora(aseguradora);
    }
    // Recordar la fecha mínima de cobertura para poder volver a la aseguradora
    if (result?.kind === "limite_paciente") {
      setCoverageMinDate(result.fechaPermitida);
    }
    setPayParticularOverride(true);
    setCoverageOnly(false);
    setAseguradora("Particular");
    // Mostrar disponibilidad particular en la fecha preferida
    if (preferredDate) setDate(preferredDate);
    navigate({ to: "/disponibilidad" });
  };

  const buscarNuevaCita = () => {
    reset();
    navigate({ to: "/" });
  };

  const verConAseguradora = (minDate?: string) => {
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
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-6">
        <BackButton />
      </div>
      <div className="mx-auto max-w-xl space-y-6 px-4 pb-16">
        {result.kind === "ok" && (
          <>
            <ResultHeader
              icon={CheckCircle2}
              tone="success"
              title="Todo listo para confirmar tu cita"
              subtitle={
                aseguradora
                  ? `Verificamos tu cobertura con ${aseguradora}.`
                  : "Verificamos los datos y todo está en orden."
              }
            />
            <IntentSummary specialty={specialty} service={service} slot={slot} />
            <PrimaryAction label="Confirmar cita" onClick={goPago} />
          </>
        )}

        {result.kind === "limite_paciente" && (() => {
          const fechaLabel = format(
            parseYmd(result.fechaPermitida),
            "d 'de' MMMM",
            { locale: es },
          );
          return (
            <>
              <ResultHeader
                icon={AlertTriangle}
                tone="warning"
                title="Tu aseguradora aún no cubre esta cita"
                subtitle={
                  <>
                    Tu aseguradora cubre citas de este servicio a partir del{" "}
                    <span className="font-medium text-foreground">{fechaLabel}</span>.
                  </>
                }
              />
              <IntentSummary specialty={specialty} service={service} slot={slot} compact />
              <PrimaryAction
                icon={CalendarDays}
                label={`Ver disponibilidad desde el ${fechaLabel} con mi aseguradora`}
                onClick={() => verConAseguradora(result.fechaPermitida)}
              />

              {particularSlot && (
                <>
                  <div className="flex items-center gap-3 py-2 text-sm font-medium text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span className="tracking-wide">o puedes tomar esta cita</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <SuggestedSlotCard
                    slot={particularSlot}
                    eyebrow="Cita particular sugerida"
                    ctaLabel="Agendar esta cita"
                    onSelect={() => tomarSugeridoParticular(particularSlot)}
                    secondaryLabel="Ver más disponibilidad"
                    onSecondary={verMasParticulares}
                  />
                </>
              )}

              <div>
                <SecondaryActions title="Otras opciones">
                  <SecondaryActionRow
                    icon={ListChecks}
                    label="Inscribirme en lista de espera"
                    onClick={() => setWaitlistOpen(true)}
                  />
                </SecondaryActions>
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={buscarNuevaCita}
                    className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Buscar nueva cita
                  </button>
                </div>
              </div>
            </>
          );
        })()}


        {result.kind === "sin_cobertura" && (
          <>
            <ResultHeader
              icon={Info}
              tone="info"
              title="Aún no estás cubierto por tu aseguradora"
              subtitle="Contáctate con tu aseguradora al 800 721 3344"
            />
            <IntentSummary specialty={specialty} service={service} slot={slot} compact />

            {particularSlot && (
              <>
                <p className="py-2 text-center text-sm font-medium text-muted-foreground">
                  puedes tomar esta cita
                </p>
                <SuggestedSlotCard
                  slot={particularSlot}
                  eyebrow="Cita particular sugerida"
                  ctaLabel="Agendar esta cita"
                  onSelect={() => tomarSugeridoParticular(particularSlot)}
                  secondaryLabel="Ver más disponibilidad"
                  onSecondary={verMasParticulares}
                />
              </>
            )}

            <div>
              <SecondaryActions title="Otras opciones">
                <SecondaryActionRow
                  icon={ListChecks}
                  label="Inscribirme en lista de espera"
                  onClick={() => setWaitlistOpen(true)}
                />
              </SecondaryActions>
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={buscarNuevaCita}
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Buscar nueva cita
                </button>
              </div>
            </div>
          </>
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
