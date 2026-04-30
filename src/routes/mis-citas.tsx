import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Clock, Stethoscope, RefreshCw, X, CreditCard, CheckCircle2, ArrowLeft } from "lucide-react";
import { useBooking, type Intent } from "@/store/booking";
import { getAppointmentsByDoc, cancelAppointment, confirmAppointment, markPaid, type Appointment } from "@/mocks/appointments";
import { parseYmd, formatTime } from "@/mocks/availability";
import { formatCOP, SEDE_ADDRESSES } from "@/mocks/catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AssistantLayout } from "@/components/AssistantLayout";

export const Route = createFileRoute("/mis-citas")({
  head: () => ({ meta: [{ title: "Mis citas" }] }),
  component: MisCitas,
});

function statusBadge(s: Appointment["status"]) {
  const map: Record<Appointment["status"], { text: string; cls: string }> = {
    pendiente: { text: "Pendiente", cls: "bg-amber-100 text-amber-800" },
    pendiente_pago: { text: "Pendiente de pago", cls: "bg-amber-100 text-amber-800" },
    confirmada: { text: "Confirmada", cls: "bg-emerald-100 text-emerald-800" },
    cancelada: { text: "Cancelada", cls: "bg-muted text-muted-foreground" },
  };
  const { text, cls } = map[s];
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>{text}</span>;
}

function MisCitas() {
  const navigate = useNavigate();
  const documento = useBooking((s) => s.documento);
  const intent = useBooking((s) => s.intent);
  const setIntent = useBooking((s) => s.setIntent);
  const setCurrentAppointmentId = useBooking((s) => s.setCurrentAppointmentId);
  const setSpecialty = useBooking((s) => s.setSpecialty);
  const setService = useBooking((s) => s.setService);
  const setAseguradora = useBooking((s) => s.setAseguradora);
  const setFlowResult = useBooking((s) => s.setFlowResult);
  const pushChat = useBooking((s) => s.pushChat);

  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Appointment | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!documento) navigate({ to: "/" });
  }, [documento, navigate]);

  const appts = useMemo(() => (documento ? getAppointmentsByDoc(documento) : []), [documento, refresh]);

  function pickAction(a: Appointment, action: Intent) {
    setCurrentAppointmentId(a.id);
    setIntent(action);

    if (action === "reagendar") {
      setSpecialty(a.specialty);
      setService(a.service);
      setAseguradora(a.aseguradora);
      pushChat({ from: "system", text: `Reagendando ${a.specialty} — ${a.service}. Elige un nuevo horario.` });
      navigate({ to: "/disponibilidad" });
    } else if (action === "cancelar") {
      setConfirmCancel(a);
    } else if (action === "confirmar") {
      if (a.requiresPay) {
        // Simular ir a pago: usamos /pago genérico (placeholder simplificado)
        setDoneMsg(`Tu cita de ${a.specialty} requiere pago de ${formatCOP(a.price)}. Redirigiendo al pago…`);
        setTimeout(() => {
          markPaid(a.id);
          pushChat({ from: "system", text: `✅ Pago realizado. Cita de ${a.specialty} confirmada.` });
          setFlowResult("paid");
          setRefresh((x) => x + 1);
          setDoneMsg("✅ Tu cita ya se encuentra pagada y confirmada.");
        }, 1500);
      } else {
        confirmAppointment(a.id);
        pushChat({ from: "system", text: `✅ Asistencia confirmada para ${a.specialty}.` });
        setFlowResult("confirmed");
        setRefresh((x) => x + 1);
        setDoneMsg("✅ Tu asistencia quedó confirmada.");
      }
    } else if (action === "pagar") {
      setDoneMsg(`Procesando pago de ${formatCOP(a.price)}…`);
      setTimeout(() => {
        markPaid(a.id);
        pushChat({ from: "system", text: `✅ Pago realizado. Cita confirmada.` });
        setFlowResult("paid");
        setRefresh((x) => x + 1);
        setDoneMsg("✅ Tu cita ya se encuentra pagada y confirmada.");
      }, 1500);
    }
  }

  function doCancel() {
    if (!confirmCancel) return;
    cancelAppointment(confirmCancel.id);
    pushChat({ from: "system", text: `🗑️ Cita de ${confirmCancel.specialty} cancelada.` });
    setFlowResult("cancelled");
    setConfirmCancel(null);
    setSelected(null);
    setRefresh((x) => x + 1);
    setDoneMsg("🗑️ ¡Listo! La cita se canceló con éxito.");
  }

  return (
    <AssistantLayout>
      <div className="min-h-full bg-muted/30">
        <div className="border-b border-border bg-muted/60">
          <div className="mx-auto max-w-5xl px-4 py-6">
            <button
              onClick={() => navigate({ to: "/" })}
              className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Inicio
            </button>
            <h1 className="text-2xl font-bold md:text-3xl">Mis próximas citas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecciona una cita para reagendar, cancelar, confirmar o pagar.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8">
          {doneMsg && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {doneMsg}
            </div>
          )}

          {appts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center">
              <p className="text-muted-foreground">No tienes citas activas en este momento.</p>
              <Button onClick={() => navigate({ to: "/" })} className="mt-4 rounded-full">Volver al inicio</Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {appts.map((a) => {
                const d = parseYmd(a.date);
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => setSelected(a)}
                      className="block w-full rounded-2xl border border-border bg-background p-5 text-left transition hover:border-foreground"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                            <Stethoscope className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold">{a.specialty} — {a.service}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })} · {formatTime(a.hour, a.minute)}
                            </div>
                          </div>
                        </div>
                        {statusBadge(a.status)}
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {a.sede}</div>
                        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {a.attention}</div>
                        <div className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> {a.requiresPay ? formatCOP(a.price) : "Sin cobro"}</div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {intent && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Intent activo: <span className="font-medium text-foreground">{intent}</span>
            </p>
          )}
        </div>
      </div>

      {/* Detalle */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle de tu cita</DialogTitle>
                <DialogDescription>¿Qué te gustaría hacer con esta cita?</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 text-sm">
                <div>🩺 <b>Servicio:</b> {selected.specialty} — {selected.service}</div>
                <div className="capitalize">📅 <b>Fecha:</b> {format(parseYmd(selected.date), "EEEE d 'de' MMMM", { locale: es })} · {formatTime(selected.hour, selected.minute)}</div>
                <div>👨‍⚕️ <b>Profesional:</b> {selected.profesional}</div>
                <div>📍 <b>Lugar:</b> {selected.sede} — {SEDE_ADDRESSES[selected.sede] ?? ""}</div>
                <div>💻 <b>Modalidad:</b> {selected.attention}</div>
                <div>🛡️ <b>Aseguradora:</b> {selected.aseguradora}</div>
                {selected.requiresPay && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                    💳 Esta cita requiere pago de {formatCOP(selected.price)} para confirmarse.
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button variant="outline" className="rounded-full" onClick={() => pickAction(selected, "reagendar")}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Reagendar
                </Button>
                {selected.requiresPay ? (
                  <Button className="rounded-full" onClick={() => pickAction(selected, "pagar")}>
                    <CreditCard className="mr-2 h-4 w-4" /> Pagar y confirmar
                  </Button>
                ) : (
                  <Button className="rounded-full" onClick={() => pickAction(selected, "confirmar")}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar asistencia
                  </Button>
                )}
                <Button variant="destructive" className="rounded-full" onClick={() => pickAction(selected, "cancelar")}>
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar cancelación */}
      <Dialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar esta cita?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Liberaremos el horario para otros pacientes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(null)}>No, mantener</Button>
            <Button variant="destructive" onClick={doCancel}>Sí, cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AssistantLayout>
  );
}
