import { findNextAvailableDate, parseYmd, ymd } from "./availability";

export type CoverageResult =
  | { case: 1; message: string }
  | { case: 2; message: string; suggestedDate: string }
  | { case: 3; message: string };

/**
 * Reglas mock deterministas, dependientes de la fecha del slot.
 *
 * - Particular        → Caso 1 (no se valida)
 * - EPS Sanitas       → Caso 1 siempre
 * - EPS Sura          → Caso 3 si Cardiología + "Primera vez"
 *                       Caso 1 si la fecha del slot es ≥ 2026-08-01
 *                       Caso 2 (cubre pero no en esa fecha) en otro caso, sugerir
 *                       el primer día disponible desde el 2026-08-03.
 * - EPS Compensar     → Caso 3 para cualquier "Primera vez"; Caso 1 en lo demás.
 */
export function validateCoverage(
  aseguradora: string,
  specialty: string,
  service: string,
  slotDateYmd: string,
): CoverageResult {
  if (aseguradora === "Particular") {
    return { case: 1, message: "Pago particular — no requiere validación de cobertura." };
  }

  if (aseguradora === "EPS Sanitas") {
    return { case: 1, message: "Tu aseguradora cubre esta cita." };
  }

  if (aseguradora === "EPS Sura") {
    if (specialty === "Cardiología" && service === "Primera vez") {
      return { case: 3, message: "Tu aseguradora no cubre esta cita." };
    }
    const slotDate = parseYmd(slotDateYmd);
    const coverageStart = new Date(2026, 7, 1); // 1 Ago 2026
    if (slotDate >= coverageStart) {
      return { case: 1, message: "Tu aseguradora cubre esta cita." };
    }
    const next = findNextAvailableDate(new Date(2026, 7, 3), specialty, service) ?? coverageStart;
    return {
      case: 2,
      message: "Tu aseguradora cubre este servicio, pero no para la fecha seleccionada.",
      suggestedDate: ymd(next),
    };
  }

  if (aseguradora === "EPS Compensar") {
    if (service === "Primera vez") {
      return { case: 3, message: "Tu aseguradora no cubre esta cita." };
    }
    return { case: 1, message: "Tu aseguradora cubre esta cita." };
  }

  return { case: 1, message: "Tu aseguradora cubre esta cita." };
}
