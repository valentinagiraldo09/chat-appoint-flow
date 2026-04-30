import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Building2, Loader2, ShieldCheck } from "lucide-react";
import { useBooking } from "@/store/booking";
import { formatCOP } from "@/mocks/catalog";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/pago")({
  head: () => ({ meta: [{ title: "Pago de la cita" }] }),
  component: P6,
});

function P6() {
  const navigate = useNavigate();
  const slot = useBooking((s) => s.selectedSlot);
  const coverage = useBooking((s) => s.coverage);
  const payParticular = useBooking((s) => s.payParticularOverride);
  const setPaymentMethod = useBooking((s) => s.setPaymentMethod);
  const setConfirmationCode = useBooking((s) => s.setConfirmationCode);

  const [method, setMethod] = useState<"online" | "clinic" | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!slot) navigate({ to: "/" });
  }, [slot, navigate]);

  if (!slot) return null;

  const needsPay = payParticular || coverage?.case === 3;
  const amount = needsPay ? slot.price : 0;

  function confirm() {
    if (needsPay && !method) return;
    setProcessing(true);
    setTimeout(() => {
      setPaymentMethod(needsPay ? (method as "online" | "clinic") : "none");
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
        <h1 className="text-3xl font-bold">{needsPay ? "Realiza el pago de tu cita" : "Confirma tu cita"}</h1>
        <p className="mt-2 text-muted-foreground">
          {needsPay
            ? "Elige cómo deseas pagar el valor de tu cita médica."
            : "Tu aseguradora cubre esta cita. Solo confirma para finalizar."}
        </p>

        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total a {needsPay ? "pagar" : "confirmar"}</span>
            <span className="text-2xl font-bold">{needsPay ? formatCOP(amount) : "Cubierto"}</span>
          </div>
        </div>

        {needsPay && (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <MethodCard
              icon={<CreditCard className="h-5 w-5" />}
              title="Pagar en línea"
              desc="Tarjeta crédito o débito (PSE)"
              selected={method === "online"}
              onClick={() => setMethod("online")}
            />
            <MethodCard
              icon={<Building2 className="h-5 w-5" />}
              title="Pagar en la clínica"
              desc="Al momento de tu atención"
              selected={method === "clinic"}
              onClick={() => setMethod("clinic")}
            />
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Pagos cifrados, nunca guardamos los datos de tu tarjeta.
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={confirm}
            disabled={(needsPay && !method) || processing}
            className="rounded-full bg-foreground px-8 text-background hover:bg-foreground/90"
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {processing ? "Procesando..." : needsPay ? "Pagar y confirmar cita" : "Confirmar cita"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MethodCard({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border bg-card p-4 text-left transition-all " +
        (selected ? "border-foreground shadow-md" : "border-border hover:border-foreground/40")
      }
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">{icon}</div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
      </div>
    </button>
  );
}
