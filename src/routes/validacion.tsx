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
  CalendarDays,
  Info,
  ShieldOff,
  Clock4,
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
import { formatCOP } from "@/mocks/catalog";
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

  if (!result || !slot) return null;

  const goPago = () => navigate({ to: "/pago" });

  const tomarSlotActualParticular = () => {
    setPayParticularOverride(true);
    goPago();
  };

  const tomarSugeridoParticular = (s: Slot) => {
    setSelectedSlot(s);
    setPayParticularOverride(true);
    goPago();
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

              <div className="px-1 pt-2 text-sm font-medium text-muted-foreground">
                Puedes tomar esta cita
              </div>

              {particularSlot ? (
                <SuggestedSlotCard
                  slot={particularSlot}
                  eyebrow="Cita particular sugerida"
                  ctaLabel="Agendar esta cita"
                  onSelect={() => tomarSugeridoParticular(particularSlot)}
                  secondaryLabel="Ver más disponibilidad"
                  onSecondary={verMasParticulares}
                />
              ) : (
                <div className="rounded-2xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                  No encontramos un horario particular cercano.
                </div>
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

        {result.kind === "lista_negra" && (
          <>
            <ResultHeader
              icon={ShieldOff}
              tone="info"
              title="Esta cita no se puede agendar con tu aseguradora"
              subtitle={
                <>
                  Comunícate con {aseguradora ?? "tu aseguradora"} al{" "}
                  <a
                    href={`tel:${result.telefonoEPS.replace(/\s/g, "")}`}
                    className="font-medium text-foreground underline"
                  >
                    {result.telefonoEPS}
                  </a>{" "}
                  para más información.
                </>
              }
            />
            <IntentSummary specialty={specialty} service={service} slot={slot} />
            <PrimaryAction
              icon={CreditCard}
              label={`Tomar esta cita como particular · ${formatCOP(slot.price)}`}
              onClick={tomarSlotActualParticular}
            />
            <SecondaryActions>
              <SecondaryActionRow
                icon={CalendarSearch}
                label="Ver más horarios particulares"
                onClick={verMasParticulares}
              />
              <SecondaryActionRow
                icon={Phone}
                label={`Llamar a ${aseguradora ?? "mi aseguradora"}`}
                description={result.telefonoEPS}
                href={`tel:${result.telefonoEPS.replace(/\s/g, "")}`}
              />
            </SecondaryActions>
          </>
        )}

        {result.kind === "sin_cobertura" && (
          <>
            <ResultHeader
              icon={Info}
              tone="info"
              title="Tu aseguradora no cubre esta cita"
            />
            <IntentSummary specialty={specialty} service={service} slot={slot} compact />

            <div className="px-1 pt-2 text-sm font-medium text-muted-foreground">
              Puedes tomar esta cita
            </div>

            {particularSlot ? (
              <SuggestedSlotCard
                slot={particularSlot}
                eyebrow="Cita particular sugerida"
                ctaLabel="Agendar esta cita"
                onSelect={() => tomarSugeridoParticular(particularSlot)}
                secondaryLabel="Ver más disponibilidad"
                onSecondary={verMasParticulares}
              />
            ) : (
              <div className="rounded-2xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                No encontramos un horario particular cercano.
              </div>
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

        {result.kind === "sin_alternativa" && (
          <>
            <ResultHeader
              icon={Info}
              tone="info"
              title="Tu aseguradora no cubre esta cita"
              subtitle="No encontramos una cita particular alternativa para ofrecerte en este momento."
            />
            <IntentSummary specialty={specialty} service={service} slot={slot} compact />

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

        {result.kind === "sin_disponibilidad" && (
          <>
            <ResultHeader
              icon={Clock4}
              tone="neutral"
              title="No encontramos disponibilidad en este momento"
              subtitle={
                <>
                  Te avisamos apenas se libere un horario
                  {specialty ? ` para ${specialty}` : ""}
                  {aseguradora ? ` con ${aseguradora}` : ""}.
                </>
              }
            />
            <IntentSummary specialty={specialty} service={service} slot={slot} />
            <PrimaryAction
              icon={ListChecks}
              label="Inscribirme en lista de espera"
              onClick={() => setWaitlistOpen(true)}
            />
          </>
        )}

        {/* fallback safety - never used but keeps exhaustive feel */}
        {false && <XCircle className="hidden" />}
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
