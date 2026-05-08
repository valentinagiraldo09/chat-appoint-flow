import type { Slot } from "./availability";
import { findNextAvailableDate, ymd } from "./availability";

export type ValidationResult =
  | { kind: "ok" }
  | { kind: "limite_paciente"; fechaPermitida: string }
  | { kind: "sin_cobertura" };

export type ValidationInput = {
  documento: string;
  aseguradora?: string;
  specialty?: string;
  service?: string;
  slot?: Slot;
  bypassCoverage?: boolean;
};

/**
 * Reglas mock deterministas para QA del flujo P5.
 * Solo 3 estados: ok, limite_paciente, sin_cobertura.
 * El documento es la palanca principal para QA.
 */
export function runValidations(input: ValidationInput): ValidationResult {
  const { documento, aseguradora, specialty, service, slot, bypassCoverage } = input;
  const doc = documento.trim();
  const isParticular = aseguradora === "Particular" || !aseguradora;

  // Particular u override: no se valida cobertura ni reglas QA.
  if (bypassCoverage || isParticular) {
    return { kind: "ok" };
  }

  // Documento termina en 11 -> límite de paciente
  if (doc.endsWith("11")) {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + 30);
    const next =
      specialty && service
        ? findNextAvailableDate(base, specialty, service) ?? base
        : base;
    const fechaPermitida = ymd(next);
    if (slot?.date && slot.date >= fechaPermitida) return { kind: "ok" };
    return { kind: "limite_paciente", fechaPermitida };
  }

  // Documento termina en 22, 00 o 33 -> sin cobertura del servicio (forzado para QA)
  if (doc.endsWith("22") || doc.endsWith("00") || doc.endsWith("33")) {
    return { kind: "sin_cobertura" };
  }

  // Si vino de slot particular o es Particular, ya pasa OK.
  if (bypassCoverage || isParticular) {
    return { kind: "ok" };
  }

  // Reglas por especialidad
  if (specialty === "Pediatría" && aseguradora === "EPS Sura" && service === "Primera vez") {
    return { kind: "sin_cobertura" };
  }
  if (specialty === "Cardiología" && service === "Primera vez") {
    return { kind: "sin_cobertura" };
  }

  return { kind: "ok" };
}
