## Bug

En **estado-3** (ej. Optometría + Primera vez + Nueva EPS), `/disponibilidad` muestra correctamente solo cupos **particulares** (porque la EPS no cubre el servicio). Pero al seleccionar uno y confirmar, el flujo nunca marca la cita como "particular":

- `ConfirmModal` solo hace `setSelectedSlot` + `navigate("/checkout")`. **No** setea `payParticularOverride`.
- En `/checkout`, `runValidations` recibe `aseguradora = "Nueva EPS"` y `bypassCoverage = false`.
- Las reglas QA por sufijo de documento (`endsWith("11" | "22" | "00" | "33")`) corren **antes** del short-circuit `if (bypassCoverage || isParticular) return ok`, así que cualquier documento de prueba con esos sufijos dispara `limite_paciente` o `sin_cobertura` aunque el slot sea particular.

Resultado: con un slot particular el usuario debería pasar directo a pago, pero ve la pantalla de validación.

## Fix

Dos cambios mínimos, solo en presentación/flujo (sin tocar reglas de negocio reales):

### 1. `src/mocks/validations.ts` — short-circuit primero

Mover el bloque `if (bypassCoverage || isParticular) return { kind: "ok" }` **arriba**, antes de los checks `endsWith("11"/"22"/"00"/"33")`. Regla: **si la cita es particular (o se forzó override), no se valida nada — pasa directo a pago.**

```ts
// Particular / override: no se valida cobertura ni reglas QA.
if (bypassCoverage || isParticular) {
  return { kind: "ok" };
}

// (resto de reglas: sufijos de documento + reglas por especialidad)
```

### 2. `src/components/ConfirmModal.tsx` — marcar override en estado-3

Al confirmar un slot, si `getEstadoDisponibilidad(specialty, aseguradora) === "estado-3"` (la aseguradora no cubre el servicio y los cupos mostrados son particulares), llamar `setPayParticularOverride(true)` antes de `navigate("/checkout")`. En el resto de estados se mantiene el comportamiento actual (`false` por defecto).

## Resultado esperado

- Optometría + Primera vez + Nueva EPS → tomar slot → checkout → al enviar, **se salta** `/validacion` y va directo a `/pago` como particular, sin importar el documento.
- El resto de combinaciones (estado-1, estado-2 con slot EPS, estado-4) conservan la lógica de validación tal cual.