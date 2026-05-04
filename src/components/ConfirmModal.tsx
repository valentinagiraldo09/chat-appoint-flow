import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/store/booking";
import { type Slot, formatTime, parseYmd } from "@/mocks/availability";
import { formatCOP, SEDE_ADDRESSES } from "@/mocks/catalog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function ConfirmModal({
  slot,
  open,
  onOpenChange,
}: {
  slot: Slot | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const setSelectedSlot = useBooking((s) => s.setSelectedSlot);
  const service = useBooking((s) => s.service);
  const specialty = useBooking((s) => s.specialty);
  const aseguradora = useBooking((s) => s.aseguradora);

  if (!slot) return null;
  const date = parseYmd(slot.date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <h2 className="text-2xl font-bold">¿Avanzamos con esta cita?</h2>
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-600">
                {formatTime(slot.hour, slot.minute)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground capitalize">
                {format(date, "EEEE d 'de' MMMM", { locale: es })}
              </div>
            </div>
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-medium",
                slot.attention === "Telemedicina" && "border-amber-400 text-amber-700 bg-amber-50",
                slot.attention === "Presencial" && "border-emerald-400 text-emerald-700 bg-emerald-50",
                slot.attention === "Telefónica" && "border-sky-400 text-sky-700 bg-sky-50",
              )}
            >
              {slot.attention}
            </span>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div>
              <span className="font-medium">{specialty}</span>
              {service && <span className="text-muted-foreground"> — {service}</span>}
            </div>
            <div>{slot.profesional}</div>
            {slot.attention === "Presencial" && (
              <div className="text-muted-foreground">
                {slot.sede}
                {SEDE_ADDRESSES[slot.sede] && ` · ${SEDE_ADDRESSES[slot.sede]}`}
              </div>
            )}
            {aseguradora && (
              <div className="text-muted-foreground">Aseguradora: {aseguradora}</div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <span className="rounded-md bg-background px-3 py-1.5 font-bold">
              {formatCOP(slot.price)}
            </span>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            onClick={() => {
              setSelectedSlot(slot);
              onOpenChange(false);
              navigate({ to: "/checkout" });
            }}
          >
            Sí, avanzar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
