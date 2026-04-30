import { findNextAvailableDate, parseYmd, ymd } from "./availability";

export type CoverageResult =
  | { case: 1; message: string }
  | { case: 2; message: string; suggestedDate: string }
  | { case: 3; message: string };

/**
 * Reglas deterministas (mock):
 * - Particular: no se debe llamar (se enruta directo a /pago).
 * - EPS Sanitas: caso 1 (cubre).
 * - EPS Sura: caso 3 (no cubre).
 * - EPS Compensar:
 *    - si la fecha del slot es anterior a Agosto 2026 → caso 2 (sugerir fecha cubierta)
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
    return { case: 3, message: "Tu aseguradora no cubre esta cita." };
  }
  if (aseguradora === "EPS Compensar") {
    const cutoff = new Date(2026, 7, 1); // Agosto 2026
    const sd = slotDate ? parseYmd(slotDate) : new Date();
    if (sd < cutoff) {
      const next = findNextAvailableDate(cutoff, specialty, service) ?? cutoff;
      return {
        case: 2,
        message: "Tu aseguradora cubre este servicio, pero no para la fecha seleccionada.",
        suggestedDate: ymd(next),
      };
    }
    return { case: 1, message: "Tu aseguradora cubre esta cita." };
  }
  return { case: 1, message: "Tu aseguradora cubre esta cita." };
}
