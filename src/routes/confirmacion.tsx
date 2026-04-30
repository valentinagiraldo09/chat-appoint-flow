import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import jsPDF from "jspdf";
import { CheckCircle2, Calendar, Download, Home, Stethoscope, MapPin, Clock, User } from "lucide-react";
import { useBooking } from "@/store/booking";
import { parseYmd, formatTime } from "@/mocks/availability";
import { formatCOP, SEDE_ADDRESSES } from "@/mocks/catalog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";

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
  const reset = useBooking((s) => s.reset);

  useEffect(() => {
    if (!slot || !patient || !code) navigate({ to: "/" });
  }, [slot, patient, code, navigate]);

  if (!slot || !patient || !code) return null;

  const date = parseYmd(slot.date);
  const dateLabel = format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

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
      ["Dirección", SEDE_ADDRESSES[slot!.sede] ?? "-"],
      ["Modalidad", slot!.attention],
      ["Aseguradora", aseguradora ?? "-"],
      ["Pago", paymentMethod === "online" ? "Pagado en línea" : paymentMethod === "clinic" ? "Pagar en clínica" : "Cubierto por aseguradora"],
      ["Valor", formatCOP(slot!.price)],
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
      "PRODID:-//Lovable Salud//ES",
      "BEGIN:VEVENT",
      `UID:${code}@lovable-salud`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(dt)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:Cita ${specialty} - ${service}`,
      `DESCRIPTION:Profesional ${slot!.profesional} - ${slot!.attention}`,
      `LOCATION:${slot!.sede} - ${SEDE_ADDRESSES[slot!.sede] ?? ""}`,
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

  function nuevaCita() {
    reset();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-emerald-100 p-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">¡Tu cita está confirmada!</h1>
          <p className="mt-2 text-muted-foreground">
            Te enviamos los detalles a {patient.email}
          </p>
          <div className="mt-3 rounded-full bg-muted px-4 py-1 text-sm font-medium">
            Código: {code}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Detalles de la cita</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <Row icon={<User className="h-4 w-4" />} label="Paciente" value={patient.nombre} />
            <Row icon={<Stethoscope className="h-4 w-4" />} label="Especialidad" value={`${specialty} — ${service}`} />
            <Row icon={<Calendar className="h-4 w-4" />} label="Fecha" value={dateLabel} className="capitalize" />
            <Row icon={<Clock className="h-4 w-4" />} label="Hora" value={`${formatTime(slot.hour, slot.minute)} (${slot.attention})`} />
            <Row icon={<User className="h-4 w-4" />} label="Profesional" value={slot.profesional} />
            <Row icon={<MapPin className="h-4 w-4" />} label="Sede" value={`${slot.sede} — ${SEDE_ADDRESSES[slot.sede] ?? ""}`} />
          </div>
          <div className="mt-4 border-t border-border pt-4 flex justify-between">
            <span className="text-sm text-muted-foreground">
              {paymentMethod === "none" ? "Cobertura aseguradora" : paymentMethod === "online" ? "Pagado en línea" : "Pago pendiente en clínica"}
            </span>
            <span className="font-semibold">{formatCOP(slot.price)}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button onClick={downloadPDF} variant="outline" className="rounded-full">
            <Download className="mr-2 h-4 w-4" /> Descargar PDF
          </Button>
          <Button onClick={downloadICS} variant="outline" className="rounded-full">
            <Calendar className="mr-2 h-4 w-4" /> Agregar al calendario
          </Button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button onClick={nuevaCita} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            <Home className="mr-2 h-4 w-4" /> Agendar otra cita
          </Button>
          <Link to="/" className="text-sm text-muted-foreground hover:underline">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={"font-medium " + (className ?? "")}>{value}</div>
      </div>
    </div>
  );
}
