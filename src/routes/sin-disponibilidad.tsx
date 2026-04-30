import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarOff, Bell, Home } from "lucide-react";
import { useState } from "react";
import { useBooking } from "@/store/booking";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sin-disponibilidad")({
  head: () => ({ meta: [{ title: "Sin disponibilidad" }] }),
  component: NoAvail,
});

function NoAvail() {
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const [notified, setNotified] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <CalendarOff className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold md:text-3xl">No hay citas disponibles por ahora</h1>
        <p className="mt-3 whitespace-pre-line text-muted-foreground">
          {`😔 Lo siento, por ahora no tengo citas disponibles${specialty ? ` para ${specialty}${service ? ` — ${service}` : ""}` : " para este servicio"}.

Estamos trabajando para abrir nuevos espacios. Por favor, intenta consultar de nuevo en unos días.`}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          {notified ? (
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✅ Te avisaremos por correo cuando se abra disponibilidad.
            </div>
          ) : (
            <Button onClick={() => setNotified(true)} className="rounded-full">
              <Bell className="mr-2 h-4 w-4" /> Notificarme cuando abra disponibilidad
            </Button>
          )}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4" /> Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
