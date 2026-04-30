export type AttentionType = "Presencial" | "Telemedicina" | "Telefónica";
export type Franja = "Mañana" | "Tarde" | "Noche";

export const SPECIALTIES = [
  "Cardiología",
  "Dermatología",
  "Medicina General",
  "Ginecología",
  "Optometría",
  "Pediatría",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

export const SERVICES: Record<Specialty, string[]> = {
  Cardiología: ["Primera vez", "Control"],
  Dermatología: ["Primera vez", "Control", "Procedimiento"],
  "Medicina General": ["Primera vez", "Control"],
  Ginecología: ["Primera vez", "Control", "Citología"],
  Optometría: ["Primera vez", "Control"],
  Pediatría: ["Primera vez", "Control", "Crecimiento y desarrollo"],
};

export const SEDES = [
  "Centro Médico Bienestar Integral",
  "Centro Médico Especializado Norte",
  "Centro Médico La Paz",
  "Clínica Wellness Usaquén",
  "Sede Chapinero",
  "Sede Suba",
];

export const SEDE_ADDRESSES: Record<string, string> = {
  "Centro Médico Bienestar Integral": "Carrera 15 #32-56, Chapinero",
  "Centro Médico Especializado Norte": "Avenida 68 #24-12",
  "Centro Médico La Paz": "Carrera 7 #45-30",
  "Clínica Wellness Usaquén": "Calle 93 #11-27",
  "Sede Chapinero": "Calle 60 #9-15",
  "Sede Suba": "Calle 145 #58-20",
};

export const PROFESIONALES = [
  "Laura Sofía Castillo Vargas",
  "Carlos Eduardo Ramírez Torres",
  "Valentina Restrepo Ortiz",
  "Andrés Felipe Gutiérrez Ruiz",
  "Diego Alejandro Moreno Sánchez",
  "Juan Carlos Pérez García",
  "María Fernanda López Martínez",
  "Ana Lucía Gómez Rincón",
];

export const ATTENTION_TYPES: AttentionType[] = ["Presencial", "Telemedicina", "Telefónica"];
export const FRANJAS: Franja[] = ["Mañana", "Tarde", "Noche"];

export const ASEGURADORAS = ["EPS Sanitas", "EPS Sura", "EPS Compensar", "Particular"];

export const TIPOS_DOCUMENTO = ["Cédula de ciudadanía", "Cédula de extranjería", "Pasaporte", "Tarjeta de identidad"];

export function franjaForHour(hour: number): Franja {
  if (hour < 12) return "Mañana";
  if (hour < 18) return "Tarde";
  return "Noche";
}

export function formatCOP(n: number): string {
  return `$ ${n.toLocaleString("es-CO")}`;
}
