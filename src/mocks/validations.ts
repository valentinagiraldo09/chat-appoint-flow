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
  const doc = documento.trim();
  const isParticular = aseguradora === "Particular" || !aseguradora;

  // Reglas que SIEMPRE corren (incluso para Particular o bypass de cobertura):
  // límites de paciente y lista negra dependen de documento + servicio, no de cobertura.

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

  // Documento termina en 22 -> sin cobertura del servicio (forzado para QA)
  if (doc.endsWith("22")) {
    return { kind: "sin_cobertura" };
  }

  // Documento termina en 33 -> sin disponibilidad con la aseguradora (forzado para QA)
  if (doc.endsWith("33")) {
    return { kind: "sin_disponibilidad" };
  }

  // A partir de aquí, validaciones de cobertura por reglas de catálogo.
  // Si vino de slot particular o es Particular, ya pasa OK.
  if (bypassCoverage || isParticular) {
    return { kind: "ok" };
  }

  // Reglas por especialidad (alternativas)
  if (specialty === "Pediatría" && aseguradora === "EPS Sura" && service === "Primera vez") {
    return { kind: "sin_disponibilidad" };
  }
  if (specialty === "Cardiología" && service === "Primera vez") {
    return { kind: "sin_cobertura" };
  }

  return { kind: "ok" };
}
