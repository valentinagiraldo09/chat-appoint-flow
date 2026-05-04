export type DispEstado = "estado-1" | "estado-2" | "estado-3" | "estado-4";

const DISPONIBILIDAD: Record<string, DispEstado> = {
  "Dermatología|Nueva EPS": "estado-1",
  "Medicina General|EPS Sanitas": "estado-1",
  "Ginecología|EPS Sura": "estado-2",
  "Pediatría|Fomag": "estado-2",
  "Optometría|Nueva EPS": "estado-3",
  "Dermatología|Fomag": "estado-3",
  "Pediatría|EPS Sura": "estado-4",
  "Ginecología|Nueva EPS": "estado-4",
};

export function getEstadoDisponibilidad(
  specialty?: string,
  aseguradora?: string,
): DispEstado {
  if (!specialty || !aseguradora) return "estado-1";
  return DISPONIBILIDAD[`${specialty}|${aseguradora}`] ?? "estado-1";
}
