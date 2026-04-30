import { findNextAvailableDate, ymd } from "./availability";

export type CoverageResult =
  | { case: 1; message: string }
  | { case: 2; message: string; suggestedDate: string }
  | { case: 3; message: string };

/**
 * Deterministic coverage rules:
 * - Particular: Caso 1 (irrelevante, salta validación normalmente)
 * - EPS Sanitas: Caso 1 siempre (cubre)
 * - EPS Sura: Caso 2 (cubre pero con disponibilidad posterior)
 * - EPS Compensar: Caso 3 si servicio Primera vez, sino Caso 1
 */
export function validateCoverage(
  aseguradora: string,
  specialty: string,
  service: string,
): CoverageResult {
  if (aseguradora === "Particular") {
    return { case: 1, message: "Pago particular — no requiere validación de cobertura." };
  }
  if (aseguradora === "EPS Sanitas") {
    return { case: 1, message: "Tu aseguradora cubre esta cita." };
  }
  if (aseguradora === "EPS Sura") {
    const future = new Date();
    future.setDate(future.getDate() + 14);
    const next = findNextAvailableDate(future, specialty, service) ?? future;
    return {
      case: 2,
      message: "Tu aseguradora tiene disponibilidad en fechas posteriores.",
      suggestedDate: ymd(next),
    };
  }
  if (aseguradora === "EPS Compensar") {
    if (service === "Primera vez") {
      return { case: 3, message: "Este servicio no está cubierto por tu aseguradora." };
    }
    return { case: 1, message: "Tu aseguradora cubre esta cita." };
  }
  return { case: 1, message: "Tu aseguradora cubre esta cita." };
}
