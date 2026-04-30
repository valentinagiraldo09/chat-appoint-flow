import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { XCircle, Clock, MapPin, Stethoscope, Calendar } from "lucide-react";
import { useBooking } from "@/store/booking";
import { parseYmd, formatTime } from "@/mocks/availability";
import { formatCOP } from "@/mocks/catalog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/cobertura-no")({
  head: () => ({ meta: [{ title: "Cobertura no disponible" }] }),
  component: CoberturaNo,
});

function CoberturaNo() {
  const navigate = useNavigate();
  const slot = useBooking((s) => s.selectedSlot);
  const aseguradora = useBooking((s) => s.aseguradora);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const coverage = useBooking((s) => s.coverage);
  const setPayParticularOverride = useBooking((s) => s.setPayParticularOverride);
  const setSelectedSlot = useBooking((s) => s.setSelectedSlot);
  const pushChat = useBooking((s) => s.pushChat);

  useEffect(() => {
    if (!slot || !coverage || coverage.case !== 2) navigate({ to: "/" });
  }, [slot, coverage, navigate]);

  if (!slot || !coverage || coverage.case !== 2) return null;
  const d = parseYmd(slot.date);

  function pagarParticular() {
    setPayParticularOverride(true);
    pushChat({ from: "bot", text: "Continuamos con pago particular para tu cita seleccionada." });
    navigate({ to: "/pago" });
  }

  function buscarOtra() {
    setSelectedSlot(undefined);
    pushChat({ from: "bot", text: `Vamos a buscar otra cita para ${service ?? "tu servicio"}.` });
    navigate({ to: "/disponibilidad" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <BackButton />
      </div>
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-red-100 p-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">Tu aseguradora no cubre esta cita</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            {aseguradora ? `${aseguradora} no tiene cobertura para esta cita. ` : ""}
            Puedes continuar como particular pagando el valor de la cita.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">Cita seleccionada</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-muted-foreground" /> {specialty} — {service}</div>
            <div className="flex items-center gap-2 capitalize"><Calendar className="h-4 w-4 text-muted-foreground" /> {format(d, "EEEE d 'de' MMMM", { locale: es })}</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {formatTime(slot.hour, slot.minute)} · {slot.attention}</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {slot.sede} · {slot.profesional}</div>
            <div className="pt-2 text-base font-semibold">Valor particular: {formatCOP(slot.price)}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={buscarOtra} className="rounded-full">
            Volver a buscar otra cita
          </Button>
          <Button onClick={pagarParticular} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            Pagar como particular
          </Button>
        </div>
      </div>
    </div>
  );
}
