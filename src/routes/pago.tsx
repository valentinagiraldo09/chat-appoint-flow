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
  const setPaymentMethod = useBooking((s) => s.setPaymentMethod);
  const setConfirmationCode = useBooking((s) => s.setConfirmationCode);

  const [method, setMethod] = useState<"online" | "clinic" | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!slot) navigate({ to: "/" });
  }, [slot, navigate]);

  if (!slot) return null;

  const amount = slot.price;

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
        <h1 className="text-3xl font-bold">Realiza el pago de tu cita</h1>
        <p className="mt-2 text-muted-foreground">
          Continúas como particular. Elige cómo deseas pagar el valor de tu cita médica.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total a pagar</span>
            <span className="text-2xl font-bold">{formatCOP(amount)}</span>
          </div>
        </div>

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

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Pagos cifrados, nunca guardamos los datos de tu tarjeta.
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={confirm}
            disabled={!method || processing}
            className="rounded-full bg-foreground px-8 text-background hover:bg-foreground/90"
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {processing ? "Procesando..." : "Pagar y confirmar cita"}
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
