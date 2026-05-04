import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBooking } from "@/store/booking";

export function WaitlistDialog({
  open,
  onOpenChange,
  specialty,
  aseguradora,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  specialty?: string;
  aseguradora?: string;
}) {
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");
  const [done, setDone] = useState(false);
  const pushChat = useBooking((s) => s.pushChat);

  function submit() {
    if (!nombre || !tel) return;
    pushChat({
      from: "bot",
      text: `${nombre}, te avisaremos al ${tel} cuando haya disponibilidad para ${specialty} con ${aseguradora}.`,
    });
    setDone(true);
    setTimeout(() => {
      onOpenChange(false);
      setDone(false);
      setNombre("");
      setTel("");
    }, 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {done ? (
          <div className="py-6 text-center">
            <div className="text-lg font-semibold">¡Listo!</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Te contactaremos cuando haya disponibilidad.
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold">Lista de espera</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Te avisaremos cuando se libere una cita de {specialty} con {aseguradora}.
            </p>
            <div className="mt-4 space-y-3">
              <Input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              <Input placeholder="Teléfono" value={tel} onChange={(e) => setTel(e.target.value)} />
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={submit} className="rounded-full">
                Inscribirme
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
