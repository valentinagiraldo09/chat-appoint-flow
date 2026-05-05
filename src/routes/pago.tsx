import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBooking } from "@/store/booking";
import { formatCOP, SEDE_ADDRESSES } from "@/mocks/catalog";
import { parseYmd, formatTime } from "@/mocks/availability";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pago")({
  head: () => ({ meta: [{ title: "Pago de la cita" }] }),
  component: P6,
});

function P6() {
  const navigate = useNavigate();
  const slot = useBooking((s) => s.selectedSlot);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const aseguradora = useBooking((s) => s.aseguradora);
  const payParticularOverride = useBooking((s) => s.payParticularOverride);
  const setPaymentMethod = useBooking((s) => s.setPaymentMethod);
  const setConfirmationCode = useBooking((s) => s.setConfirmationCode);

  const [method, setMethod] = useState<"online" | "clinic" | null>(null);
  const [processing, setProcessing] = useState(false);

  // Tiene valor para pagar solo si es particular o se eligió pagar como particular.
  const tieneValorPorPagar =
    aseguradora === "Particular" || payParticularOverride === true;

  useEffect(() => {
    if (!slot) {
      navigate({ to: "/" });
      return;
    }
    // Si la cita está cubierta por la EPS (sin valor a pagar), saltamos al paso de confirmación.
    if (!tieneValorPorPagar) {
      setPaymentMethod("none");
      const code = "CIT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      setConfirmationCode(code);
      navigate({ to: "/confirmacion" });
    }
  }, [slot, tieneValorPorPagar, navigate, setPaymentMethod, setConfirmationCode]);

  if (!slot || !tieneValorPorPagar) return null;

  const date = parseYmd(slot.date);
  const dateLabel = format(date, "EEEE d 'de' MMMM", { locale: es });
  const sedeAddress = SEDE_ADDRESSES[slot.sede];

  function confirm() {
    if (!method) return;
    setProcessing(true);
    setTimeout(() => {
      setPaymentMethod(method as "online" | "clinic");
      const code = "CIT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      setConfirmationCode(code);
      navigate({ to: "/confirmacion" });
    }, 1200);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BackButton />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="text-3xl font-bold">¿Cuando deseas pagar tu cita?</h1>
        <p className="mt-4 text-base font-semibold">
          Paga ahora y ahorra tiempo en filas largas el día de tu consulta.
        </p>

        {/* Resumen de la cita */}
        <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-lg font-bold capitalize text-emerald-600">
                {formatTime(slot.hour, slot.minute)} · {dateLabel}
              </div>
              <div className="mt-1 text-sm text-foreground/90">
                {specialty}
                {service ? ` — ${service}` : ""}
              </div>
              <div className="text-sm text-foreground/90">{slot.profesional}</div>
              <div className="text-sm text-foreground/90">
                {slot.sede}
                {sedeAddress ? ` · ${sedeAddress}` : ""}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-3">
              <span className="rounded-md border border-amber-400 px-3 py-1 text-xs font-medium text-foreground">
                {slot.attention}
              </span>
              <span className="rounded-md bg-muted px-3 py-1.5 text-sm font-bold">
                {formatCOP(slot.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Opciones de pago */}
        <div className="mt-5 space-y-3">
          <PaymentOption
            selected={method === "online"}
            onClick={() => setMethod("online")}
            title="Deseo pagar ahora y ahorrar tiempo"
            description="Cuando llegues a la cita no tendrás que realizar ningún pago."
          />
          <PaymentOption
            selected={method === "clinic"}
            onClick={() => setMethod("clinic")}
            title="Deseo pagar haciendo fila el día de la cita"
            description="El pago se realizará en el centro médico el día que asistas a la cita."
          />
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={confirm}
            disabled={!method || processing}
            className="rounded-full bg-foreground px-10 text-background hover:bg-foreground/90 disabled:opacity-50"
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {processing ? "Procesando..." : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentOption({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl border bg-card p-5 text-left transition-all",
        selected
          ? "border-foreground shadow-sm"
          : "border-border hover:border-foreground/40",
      )}
    >
      <span
        className={cn(
          "mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-foreground" : "border-muted-foreground/40",
        )}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-foreground" />}
      </span>
      <div className="min-w-0">
        <div className="text-base font-bold">{title}</div>
        <div className="mt-1 text-sm font-medium text-muted-foreground">
          {description}
        </div>
      </div>
    </button>
  );
}
