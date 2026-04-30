import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { XCircle, Clock, MapPin, Stethoscope, Calendar, ArrowLeft, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBooking } from "@/store/booking";
import { parseYmd, formatTime } from "@/mocks/availability";
import { formatCOP } from "@/mocks/catalog";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/cobertura/no-cubre")({
  head: () => ({ meta: [{ title: "Tu aseguradora no cubre esta cita" }] }),
  component: NoCubre,
});

function NoCubre() {
  const navigate = useNavigate();
  const slot = useBooking((s) => s.selectedSlot);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const aseguradora = useBooking((s) => s.aseguradora);
  const setPayParticularOverride = useBooking((s) => s.setPayParticularOverride);
  const setSelectedSlot = useBooking((s) => s.setSelectedSlot);

  useEffect(() => {
    if (!slot) navigate({ to: "/" });
  }, [slot, navigate]);

  if (!slot) return null;
  const date = parseYmd(slot.date);

  function pagarParticular() {
    setPayParticularOverride(true);
    navigate({ to: "/pago" });
  }

  function buscarOtra() {
    setSelectedSlot(undefined);
    setPayParticularOverride(false);
    navigate({ to: "/disponibilidad" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BackButton />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-6 w-6 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-red-900">Tu aseguradora no cubre esta cita</h1>
              <p className="mt-1 text-red-800">
                {aseguradora ? `${aseguradora} no cubre ` : "Tu aseguradora no cubre "}
                {specialty}{service ? ` — ${service}` : ""}. Puedes continuar como particular pagando el valor de la cita, o volver a buscar otra cita.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">Cita seleccionada</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2 capitalize text-base font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> {formatTime(slot.hour, slot.minute)} · {slot.attention}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Stethoscope className="h-4 w-4" /> {slot.profesional}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {slot.sede}
            </div>
            <div className="pt-2 text-base font-semibold">Valor particular: {formatCOP(slot.price)}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Button
            variant="outline"
            onClick={buscarOtra}
            className="rounded-full py-6 text-base"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a buscar otra cita
          </Button>
          <Button
            onClick={pagarParticular}
            className="rounded-full bg-foreground py-6 text-base text-background hover:bg-foreground/90"
          >
            <CreditCard className="mr-2 h-4 w-4" /> Pagar como particular
          </Button>
        </div>
      </div>
    </div>
  );
}
