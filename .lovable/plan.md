
# Caso 33: validación rechazada sin cita particular disponible

## Objetivo
El documento terminado en `33` representará un paciente que **no pasa la validación** (cobertura o lista negra) y para el cual **no tenemos cita particular** que ofrecer. La pantalla reutiliza el layout de `sin_cobertura` (22) pero omite el bloque de cita particular sugerida.

## Cambios

### 1. `src/mocks/validations.ts`
- Añadir nuevo tipo a `ValidationResult`:
  ```ts
  | { kind: "sin_alternativa" }
  ```
- Reasignar la regla de `doc.endsWith("33")`: en vez de `sin_disponibilidad`, devolver `{ kind: "sin_alternativa" }`.
- (Mantener `sin_disponibilidad` para reglas por especialidad como Pediatría + Sura, que sí lo usan.)

### 2. `src/routes/validacion.tsx`
Agregar una nueva rama `result.kind === "sin_alternativa"`, paralela a `sin_cobertura` pero más corta:

- `ResultHeader` con icono `Info`, tono `info`, título "Tu aseguradora no cubre esta cita" y subtítulo: "No encontramos una cita particular alternativa para ofrecerte en este momento."
- `IntentSummary` en modo `compact` (cita atenuada que se intentaba agendar).
- **Sin** texto "Puedes tomar esta cita" y **sin** `SuggestedSlotCard` ni fallback de particular.
- Bloque "Otras opciones" con `SecondaryActions` y un único `SecondaryActionRow`: "Inscribirme en lista de espera" → abre `WaitlistDialog`.
- Botón de texto centrado "Buscar nueva cita" → `buscarNuevaCita`.

No se tocan otras ramas (`ok`, `limite_paciente`, `lista_negra`, `sin_cobertura`, `sin_disponibilidad`).

## Notas técnicas
- `sin_alternativa` no necesita campos extra: la copy es estática y no depende de fecha/teléfono.
- La estructura visual es idéntica a `sin_cobertura` para mantener coherencia, simplemente sin la sección de cita sugerida.
