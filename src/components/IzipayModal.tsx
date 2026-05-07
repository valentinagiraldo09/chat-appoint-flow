import { useEffect, useMemo, useState } from "react";
import { X, Check, ChevronDown, QrCode, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { CocoLogo } from "@/components/CocoLogo";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  defaults?: { nombres?: string; apellidos?: string; email?: string };
};

function formatSoles(n: number) {
  return `S/${n.toFixed(2)}`;
}

export function IzipayModal({ open, onClose, onSuccess, amount, defaults }: Props) {
  const [tab, setTab] = useState<"card" | "plin" | "qr" | "more">("card");
  const [processing, setProcessing] = useState(false);
  const orderNumber = useMemo(
    () => Math.floor(1_000_000_000 + Math.random() * 9_000_000_000).toString(),
    [open],
  );

  useEffect(() => {
    if (!open) {
      setProcessing(false);
      setTab("card");
    }
  }, [open]);

  if (!open) return null;

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (processing) return;
    setProcessing(true);
    setTimeout(() => {
      onSuccess();
    }, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] rounded-lg bg-white text-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pb-4 pt-6">
          <CocoLogo className="h-7 w-auto" />
          <div className="text-right">
            <div className="text-[11px] text-neutral-500">Número de pedido</div>
            <div className="text-[15px] font-semibold tracking-wide text-neutral-900">
              {orderNumber}
            </div>
          </div>
        </div>

        <div className="mx-6 border-t border-neutral-200" />

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-2 px-6 pt-4">
          <PaymentTab
            active={tab === "card"}
            onClick={() => setTab("card")}
            icon={<CreditCard className="h-5 w-5" strokeWidth={1.5} />}
            label="Tarjeta"
          />
          <PaymentTab
            active={tab === "plin"}
            onClick={() => setTab("plin")}
            icon={<Smartphone className="h-5 w-5" strokeWidth={1.5} />}
            label="Plin - Interbank"
          />
          <PaymentTab
            active={tab === "qr"}
            onClick={() => setTab("qr")}
            icon={<QrCode className="h-5 w-5" strokeWidth={1.5} />}
            label="QR"
          />
          <PaymentTab
            active={tab === "more"}
            onClick={() => setTab("more")}
            icon={<ChevronDown className="h-5 w-5" strokeWidth={1.5} />}
            label=""
          />
        </div>

        <p className="px-6 pt-3 text-center text-[12px] text-neutral-600">
          Recuerda activar tus compras por internet
        </p>

        {/* Form */}
        <form onSubmit={handlePay} className="space-y-3 px-6 pt-3">
          <div className="relative">
            <input
              type="text"
              placeholder="**** **** **** ****"
              className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 pr-28 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-teal-500 focus:outline-none"
            />
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1">
              <CardChip label="VISA" className="bg-blue-700 text-white" />
              <CardChip label="MC" className="bg-neutral-800 text-white" />
              <CardChip label="◇" className="bg-neutral-200 text-neutral-700" />
              <CardChip label="AMEX" className="bg-neutral-700 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="MM / AA"
              className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-teal-500 focus:outline-none"
            />
            <div className="relative">
              <input
                type="text"
                placeholder="***"
                className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 pr-10 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-teal-500 focus:outline-none"
              />
              <CreditCard className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] text-neutral-700">Nombres</label>
              <input
                type="text"
                placeholder="Nombres"
                defaultValue={defaults?.nombres ?? ""}
                className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-neutral-700">Apellidos</label>
              <input
                type="text"
                placeholder="Apellidos"
                defaultValue={defaults?.apellidos ?? ""}
                className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] text-neutral-700">Correo electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              defaultValue={defaults?.email ?? ""}
              className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="-mx-6 mt-4 border-t border-neutral-200" />

          <button
            type="submit"
            disabled={processing}
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-md bg-teal-500 text-[15px] font-semibold text-white transition-colors hover:bg-teal-600 disabled:opacity-70"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
              </>
            ) : (
              <>Pagar {formatSoles(amount)}</>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 pb-5 pt-2 text-[10px] tracking-widest text-neutral-400">
            <span>POWERED BY</span>
            <span className="font-bold lowercase tracking-tight text-neutral-500">izipay</span>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex h-[70px] flex-col items-center justify-center gap-1 rounded-md border bg-white px-1 text-[10px] font-medium text-neutral-700 transition-colors",
        active ? "border-2 border-teal-500" : "border-neutral-300 hover:border-neutral-400",
      )}
    >
      {active && (
        <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
      <span className="text-neutral-700">{icon}</span>
      {label && <span className="leading-tight">{label}</span>}
    </button>
  );
}

function CardChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-[26px] items-center justify-center rounded-sm px-1 text-[9px] font-bold",
        className,
      )}
    >
      {label}
    </span>
  );
}
