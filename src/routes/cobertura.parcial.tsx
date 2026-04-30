import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AlertTriangle, CalendarCheck, CreditCard, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBooking } from "@/store/booking";
import { parseYmd } from "@/mocks/availability";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/cobertura/parcial")({
  head: () => ({ meta: [{ title: "Cobertura parcial" }] }),
  component: Parcial,
});

function Parcial() {
  const navigate = useNavigate();
  const slot = useBooking((s) => s.selectedSlot);
  const coverage = useBooking((s) => s.coverage);
  const aseguradora = useBooking((s) => s.aseguradora);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const setDate = useBooking((s) => s.setDate);
  const setCoverageOnly = useBooking((s) => s.setCoverageOnly);
  const setCoverageMinDate = useBooking((s) => s.setCoverageMinDate);
  const setPayParticularOverride = useBooking((s) => s.setPayParticularOverride);
  const setSelectedSlot = useBooking((s) => s.setSelectedSlot);
  const pushChat = useBooking((s) => s.pushChat);

  useEffect(() => {
    if (!slot || !coverage || coverage.case !== 2) navigate({ to: "/" });
  }, [slot, coverage, navigate]);

  if (!slot || !coverage || coverage.case !== 2) return null;

  const suggestedDate = coverage.suggestedDate;
  const suggested = parseYmd(suggestedDate);
  const suggestedLabel = format(suggested, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  function verCubiertas() {
    setSelectedSlot(undefined);
    setDate(suggestedDate);
    setCoverageOnly(true);
    setCoverageMinDate(suggestedDate);
    pushChat({
      from: "system",
      text: `Mostrando solo citas cubiertas por ${aseguradora ?? "tu aseguradora"} desde ${suggestedLabel}.`,
    });
    navigate({ to: "/disponibilidad" });
  }

  function pagarParticular() {
    setPayParticularOverride(true);
    navigate({ to: "/pago" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BackButton />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 text-amber-600" />
            <div>
              <h1 className="text-2xl font-bold text-amber-900">
                Tu aseguradora cubre este servicio, pero no para la fecha seleccionada
              </h1>
              <p className="mt-1 capitalize text-amber-900/90">
                La fecha más cercana disponible con cobertura de {aseguradora ?? "tu aseguradora"} es el {suggestedLabel}.
              </p>
              <p className="mt-2 text-sm text-amber-800">
                {specialty}{service ? ` — ${service}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            onClick={verCubiertas}
            className="rounded-2xl border border-border bg-card p-5 text-left transition hover:border-foreground/60 hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-emerald-700">
              <CalendarCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Recomendado</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold">Ver citas cubiertas por mi aseguradora</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Te llevamos a disponibilidad desde {format(suggested, "MMMM 'de' yyyy", { locale: es })} con horarios cubiertos.
            </p>
            <span className="mt-4 inline-block rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
              Ver disponibilidad cubierta
            </span>
          </button>

          <button
            onClick={pagarParticular}
            className="rounded-2xl border border-border bg-card p-5 text-left transition hover:border-foreground/60 hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-5 w-5" />
              <span className="text-sm font-medium">Conserva tu cita</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold">Pagar como particular y conservar esta cita</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Mantienes el horario que ya elegiste y pagas el valor particular.
            </p>
            <span className="mt-4 inline-block rounded-full border border-foreground bg-background px-4 py-2 text-sm font-medium">
              Pagar como particular
            </span>
          </button>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          No pierdes tu cita seleccionada — puedes volver en cualquier momento.
        </div>
      </div>
    </div>
  );
}
