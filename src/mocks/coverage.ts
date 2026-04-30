import { findNextAvailableDate, parseYmd, ymd } from "./availability";

export type CoverageResult =
  | { case: 1; message: string }
  | { case: 2; message: string }
  | { case: 3; message: string; suggestedDate: string };

/**
 * Reglas deterministas (mock), alineadas al brief:
 * - Caso 1: la aseguradora cubre la cita.
 * - Caso 2: la aseguradora NO cubre la cita.
 * - Caso 3: la aseguradora cubre el servicio, pero no para la fecha seleccionada
 *           (incluye suggestedDate con la próxima fecha cubierta).
 *
 * - Particular: no se debe llamar (se enruta directo a /pago).
 * - EPS Sanitas → caso 1.
 * - EPS Sura → caso 2.
 * - EPS Compensar:
 *    - si la fecha del slot es < Agosto 2026 → caso 3 (sugerir fecha cubierta)
 *    - si la fecha del slot es ≥ Agosto 2026 → caso 1
 */
export function validateCoverage(
  aseguradora: string,
  specialty: string,
  service: string,
  slotDate?: string,
): CoverageResult {
  if (aseguradora === "Particular") {
    return { case: 1, message: "Pago particular — no requiere validación de cobertura." };
  }
  if (aseguradora === "EPS Sanitas") {
    return { case: 1, message: "Tu aseguradora cubre esta cita." };
  }
  if (aseguradora === "EPS Sura") {
    return { case: 2, message: "Tu aseguradora no cubre esta cita." };
  }
  if (aseguradora === "EPS Compensar") {
    const cutoff = new Date(2026, 7, 1); // Agosto 2026
    const sd = slotDate ? parseYmd(slotDate) : new Date();
    if (sd < cutoff) {
      const next = findNextAvailableDate(cutoff, specialty, service) ?? cutoff;
      return {
        case: 3,
        message: "Tu aseguradora cubre este servicio, pero no para la fecha seleccionada.",
        suggestedDate: ymd(next),
      };
    }
    return { case: 1, message: "Tu aseguradora cubre esta cita." };
  }
  return { case: 1, message: "Tu aseguradora cubre esta cita." };
}
