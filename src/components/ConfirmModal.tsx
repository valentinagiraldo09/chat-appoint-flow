import { useNavigate } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/store/booking";
import { type Slot, formatTime, parseYmd } from "@/mocks/availability";
import { formatCOP, SEDE_ADDRESSES } from "@/mocks/catalog";
import { runValidations } from "@/mocks/validations";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function ConfirmModal({
  slot,
  open,
  onOpenChange,
  hidePrice,
}: {
  slot: Slot | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  hidePrice?: boolean;
}) {
  const navigate = useNavigate();
  const setSelectedSlot = useBooking((s) => s.setSelectedSlot);
  const service = useBooking((s) => s.service);
  const specialty = useBooking((s) => s.specialty);
  const aseguradora = useBooking((s) => s.aseguradora);
  const patient = useBooking((s) => s.patient);
  const payParticularOverride = useBooking((s) => s.payParticularOverride);
  const setValidationResult = useBooking((s) => s.setValidationResult);
  const coverageMinDate = useBooking((s) => s.coverageMinDate);

  if (!slot) return null;
  const date = parseYmd(slot.date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-background p-10 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Close className="absolute right-6 top-6 flex items-center gap-2 text-base font-semibold text-foreground hover:opacity-70 focus:outline-none">
            Cerrar
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>

          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            ¿Avanzamos con esta cita?
          </h2>

          <div className="mx-auto mt-8 max-w-md rounded-2xl bg-muted/50 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-bold text-emerald-600">
                  {formatTime(slot.hour, slot.minute)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground capitalize">
                  {format(date, "EEEE d 'de' MMMM", { locale: es })}
                </div>
              </div>
              <span className="rounded-md border border-amber-400 bg-amber-100 px-2.5 py-1 text-xs font-medium text-foreground">
                {slot.attention}
              </span>
            </div>

            <div className="mt-5 space-y-2 text-base">
              <div className="font-medium">
                {specialty}
                {service && <span> · {service}</span>}
              </div>
              <div>{slot.profesional}</div>
              {slot.attention === "Presencial" && (
                <div>
                  <div>{slot.sede}</div>
                  {SEDE_ADDRESSES[slot.sede] && (
                    <div className="text-muted-foreground">{SEDE_ADDRESSES[slot.sede]}</div>
                  )}
                </div>
              )}
              {aseguradora && (
                <div className="text-muted-foreground text-sm">Aseguradora: {aseguradora}</div>
              )}
            </div>

            {!hidePrice && slot.price ? (
              <div className="mt-5 flex justify-end">
                <span className="rounded-md bg-muted px-3 py-1.5 text-base font-bold text-foreground">
                  {formatCOP(slot.price)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="rounded-full bg-foreground px-10 py-6 text-base text-background hover:bg-foreground/90"
              onClick={() => {
                setSelectedSlot(slot);
                onOpenChange(false);
                // Si ya tenemos los datos del paciente, saltamos /checkout
                if (patient && coverageMinDate) {
                  const isParticular = aseguradora === "Particular";
                  if (isParticular) {
                    setValidationResult(undefined);
                    navigate({ to: "/pago" });
                    return;
                  }
                  const result = runValidations({
                    documento: patient.numeroDocumento,
                    aseguradora,
                    specialty,
                    service,
                    slot,
                    bypassCoverage: payParticularOverride,
                  });
                  setValidationResult(result);
                  if (result.kind === "ok") {
                    navigate({ to: "/pago" });
                    return;
                  }
                  navigate({ to: "/validacion" });
                  return;
                }
                navigate({ to: "/checkout" });
              }}
            >
              Sí, avanzar
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
