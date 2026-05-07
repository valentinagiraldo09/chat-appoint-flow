import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import {
  CheckCircle2,
  Calendar as CalendarIcon,
  Download,
  Printer,
  Eye,
  Copy,
  Check,
  AlertCircle,
  User as UserIcon,
  IdCard,
} from "lucide-react";
import { useBooking } from "@/store/booking";
import { parseYmd, formatTime } from "@/mocks/availability";
import { formatCOP, SEDE_ADDRESSES } from "@/mocks/catalog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CocoLogo } from "@/components/CocoLogo";
import { IzipayModal } from "@/components/IzipayModal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/confirmacion")({
  head: () => ({ meta: [{ title: "Cita confirmada" }] }),
  component: P7,
});

function P7() {
  const navigate = useNavigate();
  const slot = useBooking((s) => s.selectedSlot);
  const specialty = useBooking((s) => s.specialty);
  const service = useBooking((s) => s.service);
  const patient = useBooking((s) => s.patient);
  const aseguradora = useBooking((s) => s.aseguradora);
  const code = useBooking((s) => s.confirmationCode);
  const paymentMethod = useBooking((s) => s.paymentMethod);
  const setPaymentMethod = useBooking((s) => s.setPaymentMethod);
  const reset = useBooking((s) => s.reset);

  const [copied, setCopied] = useState(false);
  const [showIzipay, setShowIzipay] = useState(false);

  useEffect(() => {
    if (!slot || !patient || !code) navigate({ to: "/" });
  }, [slot, patient, code, navigate]);

  if (!slot || !patient || !code) return null;

  const date = parseYmd(slot.date);
  const dateLabel = format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const sedeAddress = SEDE_ADDRESSES[slot.sede];

  const isPaid = paymentMethod === "online";
  const isPendingClinic = paymentMethod === "clinic";
  const isCovered = paymentMethod === "none";

  function downloadPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Confirmación de cita médica", 20, 20);
    doc.setFontSize(11);
    doc.text(`Código: ${code}`, 20, 32);
    doc.line(20, 36, 190, 36);

    const rows: [string, string][] = [
      ["Paciente", patient!.nombre],
      ["Documento", `${patient!.tipoDocumento} ${patient!.numeroDocumento}`],
      ["Email", patient!.email],
      ["Teléfono", patient!.telefono],
      ["Especialidad", specialty ?? "-"],
      ["Servicio", service ?? "-"],
      ["Fecha", dateLabel],
      ["Hora", formatTime(slot!.hour, slot!.minute)],
      ["Profesional", slot!.profesional],
      ["Sede", slot!.sede],
      ["Dirección", sedeAddress ?? "-"],
      ["Modalidad", slot!.attention],
      ["Aseguradora", aseguradora ?? "-"],
      [
        "Pago",
        isPaid
          ? `Pagado en línea — ${formatCOP(slot!.price)}`
          : isPendingClinic
            ? `Pago pendiente en clínica — ${formatCOP(slot!.price)}`
            : "Cubierto por aseguradora",
      ],
    ];
    let y = 46;
    rows.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(v), 70, y);
      y += 8;
    });
    doc.save(`cita-${code}.pdf`);
  }

  function downloadICS() {
    const dt = new Date(date);
    dt.setHours(slot!.hour, slot!.minute, 0, 0);
    const end = new Date(dt.getTime() + 30 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Coco Salud//ES",
      "BEGIN:VEVENT",
      `UID:${code}@coco-salud`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(dt)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:Cita ${specialty} - ${service}`,
      `DESCRIPTION:Profesional ${slot!.profesional} - ${slot!.attention}`,
      `LOCATION:${slot!.sede} - ${sedeAddress ?? ""}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cita-${code}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyAddress() {
    if (!sedeAddress) return;
    navigator.clipboard.writeText(sedeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function nuevaCita() {
    reset();
    navigate({ to: "/" });
  }

  const dayLabel = format(date, "EEEE dd", { locale: es });
  const monthLabel = format(date, "MMMM", { locale: es });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Logo */}
        <div className="flex justify-center">
          <CocoLogo className="h-14 w-auto" />
        </div>

        {/* Heading */}
        <div className="mt-6 flex items-start justify-center gap-3">
          <CheckCircle2 className="mt-1 h-9 w-9 shrink-0 text-emerald-600" strokeWidth={2.5} />
          <div>
            <div className="text-xl font-bold text-foreground">Confirmación</div>
            <h1 className="text-2xl font-bold tracking-tight">
              ¡Cita agendada con éxito!
            </h1>
          </div>
        </div>

        {/* Datos del paciente */}
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="text-center text-base font-bold">Datos del paciente</div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 font-medium">
              <UserIcon className="h-4 w-4" /> {patient.nombre}
            </span>
            <span className="inline-flex items-center gap-2 font-medium">
              <IdCard className="h-4 w-4" /> C.C {patient.numeroDocumento}
            </span>
          </div>
        </div>

        {/* Card de la cita */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
          {/* Header oscuro */}
          <div className="flex items-start justify-between gap-3 bg-foreground px-5 py-4 text-background">
            <div className="flex items-start gap-3">
              <CalendarIcon className="mt-1 h-5 w-5" />
              <div>
                <div className="text-base font-bold capitalize">{dayLabel}</div>
                <div className="text-base font-bold capitalize">{monthLabel}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-md border border-emerald-400 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                {slot.attention}
              </span>
              <span className="text-base font-bold lowercase">
                {formatTime(slot.hour, slot.minute)}
              </span>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="space-y-4 px-5 py-5">
            <div className="text-base font-bold text-emerald-600">
              {specialty}
              {service ? ` · ${service}` : ""}
            </div>

            {slot.attention === "Presencial" && sedeAddress && (
              <div>
                <div className="text-sm font-bold">Sede:</div>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="mt-0.5 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
                >
                  {sedeAddress}
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 opacity-70" />
                  )}
                </button>
              </div>
            )}

            <div>
              <div className="text-sm font-bold">Profesional:</div>
              <div className="text-sm">{slot.profesional}</div>
            </div>

            {/* Estado de pago */}
            {isPaid && (
              <div className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Cita pagada: {formatCOP(slot.price)}
              </div>
            )}

            {isPendingClinic && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">
                    <AlertCircle className="h-4 w-4" />
                    Pago pendiente: {formatCOP(slot.price)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIzipay(true)}
                    className="inline-flex items-center rounded-md bg-foreground px-3 py-1.5 text-sm font-semibold text-background hover:opacity-90"
                  >
                    Pagar ahora
                  </button>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  Tu cita quedará confirmada únicamente cuando realices el pago
                  en el centro médico el día de la atención.
                </div>
              </>
            )}

            {isCovered && (
              <>
                <div className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Cubierta por {aseguradora ?? "tu aseguradora"}
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  Si tu aseguradora requiere algún copago, este deberá pagarse
                  en el centro médico el día de la cita para que sea válida.
                </div>
              </>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pt-1">
              <ActionPill icon={<Download className="h-4 w-4" />} label="Descargar" onClick={downloadPDF} />
              <ActionPill icon={<Printer className="h-4 w-4" />} label="Imprimir" onClick={() => window.print()} />
              <ActionPill icon={<CalendarIcon className="h-4 w-4" />} label="Guardar en el calendario" onClick={downloadICS} />
            </div>

            {/* Recomendaciones */}
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-3 text-sm font-bold text-foreground"
            >
              <span>Recomendaciones</span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                Ver <Eye className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={nuevaCita}
            size="lg"
            className="rounded-full bg-foreground px-8 text-background hover:bg-foreground/90"
          >
            Pedir nueva cita
          </Button>
        </div>

        <div className="mt-3 text-center text-xs text-muted-foreground">
          Código: <span className="font-mono">{code}</span>
        </div>
      </div>

      <IzipayModal
        open={showIzipay}
        onClose={() => setShowIzipay(false)}
        onSuccess={() => {
          setPaymentMethod("online");
          setShowIzipay(false);
        }}
        amount={slot.price}
        defaults={{
          nombres: patient.nombre,
          apellidos: "",
          email: patient.email,
        }}
      />
    </div>
  );
}

function ActionPill({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium",
        "hover:border-foreground/40 hover:bg-muted/40",
      )}
    >
      <span>{label}</span>
      {icon}
    </button>
  );
}
