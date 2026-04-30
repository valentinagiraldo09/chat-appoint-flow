import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AlertTriangle, Clock, MapPin, Stethoscope, Calendar } from "lucide-react";
import { useBooking } from "@/store/booking";
import { parseYmd, formatTime } from "@/mocks/availability";
import { formatCOP } from "@/mocks/catalog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/cobertura-fecha")({
  head: () => ({ meta: [{ title: "Cobertura en otra fecha" }] }),
  component: CoberturaFecha,
});

function CoberturaFecha() {
  const navigate = useNavigate();
  const slot = useBooking((s) => s.selectedSlot);
  const aseguradora = useBooking((s) => s.aseguradora);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const coverage = useBooking((s) => s.coverage);
  const setPayParticularOverride = useBooking((s) => s.setPayParticularOverride);
  const setDate = useBooking((s) => s.setDate);
  const setSelectedSlot = useBooking((s) => s.setSelectedSlot);
  const setAcceptedSuggestedDate = useBooking((s) => s.setAcceptedSuggestedDate);
  const pushChat = useBooking((s) => s.pushChat);

  useEffect(() => {
    if (!slot || !coverage || coverage.case !== 3) navigate({ to: "/" });
  }, [slot, coverage, navigate]);

  if (!slot || !coverage || coverage.case !== 3) return null;
  const d = parseYmd(slot.date);
  const sd = parseYmd(coverage.suggestedDate);
  const sdLabel = format(sd, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  function verCubiertas() {
    setDate(coverage!.case === 3 ? coverage!.suggestedDate : undefined);
    setSelectedSlot(undefined);
    setAcceptedSuggestedDate(true);
    pushChat({
      from: "bot",
      text: `Te muestro las citas con cobertura de ${aseguradora ?? "tu aseguradora"} desde ${sdLabel}.`,
    });
    navigate({ to: "/disponibilidad" });
  }

  function pagarParticular() {
    setPayParticularOverride(true);
    pushChat({ from: "bot", text: "Continuamos con pago particular y conservamos tu cita seleccionada." });
    navigate({ to: "/pago" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <BackButton />
      </div>
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-amber-100 p-4">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">
            Tu aseguradora cubre este servicio, pero no para la fecha seleccionada
          </h1>
          <p className="mt-2 max-w-md text-muted-foreground capitalize">
            La fecha más cercana disponible con cobertura de {aseguradora ?? "tu aseguradora"} es {sdLabel}.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">Tu cita seleccionada</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-muted-foreground" /> {specialty} — {service}</div>
            <div className="flex items-center gap-2 capitalize"><Calendar className="h-4 w-4 text-muted-foreground" /> {format(d, "EEEE d 'de' MMMM", { locale: es })}</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {formatTime(slot.hour, slot.minute)} · {slot.attention}</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {slot.sede} · {slot.profesional}</div>
            <div className="pt-2 text-base font-semibold">Valor particular: {formatCOP(slot.price)}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={verCubiertas} className="rounded-full">
            Ver citas cubiertas por mi aseguradora
          </Button>
          <Button onClick={pagarParticular} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            Pagar como particular y conservar esta cita
          </Button>
        </div>
      </div>
    </div>
  );
}
