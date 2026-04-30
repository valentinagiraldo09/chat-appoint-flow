// Mutable mock appointments store, seeded per-document so the same user always
// sees the same set during the session.
import { PROFESIONALES, SEDES, type AttentionType } from "./catalog";
import { ymd } from "./availability";

export type AppointmentStatus = "pendiente" | "pendiente_pago" | "confirmada" | "cancelada";

export type Appointment = {
  id: string;
  documento: string;
  specialty: string;
  service: string;
  date: string; // yyyy-mm-dd
  hour: number;
  minute: number;
  profesional: string;
  sede: string;
  attention: AttentionType;
  price: number;
  requiresPay: boolean;
  status: AppointmentStatus;
  aseguradora: string;
};

const STORE: Appointment[] = [];
const SEEDED = new Set<string>();

function uid(prefix = "apt") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

function seedFor(doc: string) {
  if (SEEDED.has(doc)) return;
  SEEDED.add(doc);

  if (doc === "1001370488") {
    STORE.push({
      id: uid(),
      documento: doc,
      specialty: "Dermatología",
      service: "Primera vez",
      date: daysFromNow(2),
      hour: 9,
      minute: 15,
      profesional: PROFESIONALES[0],
      sede: SEDES[0],
      attention: "Presencial",
      price: 150000,
      requiresPay: true,
      status: "pendiente_pago",
      aseguradora: "Particular",
    });
    STORE.push({
      id: uid(),
      documento: doc,
      specialty: "Optometría",
      service: "Control",
      date: daysFromNow(7),
      hour: 14,
      minute: 30,
      profesional: PROFESIONALES[3],
      sede: SEDES[2],
      attention: "Telemedicina",
      price: 0,
      requiresPay: false,
      status: "confirmada",
      aseguradora: "EPS Sanitas",
    });
  }

  if (doc === "52111222") {
    STORE.push({
      id: uid(),
      documento: doc,
      specialty: "Cardiología",
      service: "Control",
      date: daysFromNow(4),
      hour: 10,
      minute: 0,
      profesional: PROFESIONALES[1],
      sede: SEDES[1],
      attention: "Presencial",
      price: 90000,
      requiresPay: true,
      status: "pendiente_pago",
      aseguradora: "Particular",
    });
  }
}

export function getAppointmentsByDoc(doc: string): Appointment[] {
  seedFor(doc);
  return STORE.filter((a) => a.documento === doc && a.status !== "cancelada");
}

export function getAppointment(id: string): Appointment | undefined {
  return STORE.find((a) => a.id === id);
}

export function cancelAppointment(id: string) {
  const a = getAppointment(id);
  if (a) a.status = "cancelada";
}

export function confirmAppointment(id: string) {
  const a = getAppointment(id);
  if (a) a.status = "confirmada";
}

export function markPaid(id: string) {
  const a = getAppointment(id);
  if (a) {
    a.requiresPay = false;
    a.status = "confirmada";
  }
}

export function rescheduleAppointment(
  id: string,
  next: { date: string; hour: number; minute: number; profesional: string; sede: string; attention: AttentionType; price: number },
) {
  const a = getAppointment(id);
  if (!a) return;
  Object.assign(a, next);
  a.status = a.requiresPay ? "pendiente_pago" : "confirmada";
}

export function addAppointment(a: Omit<Appointment, "id">): Appointment {
  const apt: Appointment = { ...a, id: uid() };
  STORE.push(apt);
  return apt;
}
