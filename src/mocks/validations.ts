import type { Slot } from "./availability";
import { findNextAvailableDate, ymd } from "./availability";

export type ValidationResult =
  | { kind: "ok" }
  | { kind: "limite_paciente"; fechaPermitida: string }
  | { kind: "lista_negra"; telefonoEPS: string }
  | { kind: "sin_cobertura" }
  | { kind: "sin_disponibilidad" };

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
 * Documento es la palanca principal — permite probar cada caso desde el formulario.
 */
export function runValidations(input: ValidationInput): ValidationResult {
  const { documento, aseguradora, specialty, service, bypassCoverage } = input;

  // Excepción: si vino de slot particular o ya es Particular, no se valida cobertura
  if (bypassCoverage || aseguradora === "Particular") {
    return { kind: "ok" };
  }

  const doc = documento.trim();

  // Documento que termina en 00 -> "lista negra"
  if (doc.endsWith("00")) {
    return { kind: "lista_negra", telefonoEPS: "01 8000 123 456" };
  }

  // Documento que termina en 11 -> límite de paciente
  if (doc.endsWith("11")) {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + 30);
    const next =
      specialty && service
        ? findNextAvailableDate(base, specialty, service) ?? base
        : base;
    return { kind: "limite_paciente", fechaPermitida: ymd(next) };
  }

  // Pediatría + EPS Sura + Primera vez -> sin disponibilidad
  if (specialty === "Pediatría" && aseguradora === "EPS Sura" && service === "Primera vez") {
    return { kind: "sin_disponibilidad" };
  }

  // Cardiología + Primera vez con EPS -> servicio no cubierto
  if (specialty === "Cardiología" && service === "Primera vez") {
    return { kind: "sin_cobertura" };
  }

  return { kind: "ok" };
}
