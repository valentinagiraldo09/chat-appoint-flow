## Objetivo

Garantizar que cuando la cita se toma como **particular** nunca se navegue a `/validacion`.

Hoy en `src/routes/checkout.tsx` solo se considera "particular" cuando `aseguradora === "Particular"`. Pero si el usuario eligió una aseguradora normal y luego, desde `/validacion`, optó por **"Tomar esta cita como particular"** (lo que activa `payParticularOverride = true`), al volver a pasar por `/checkout` se vuelven a correr `runValidations` y puede caer otra vez en `/validacion`.

## Cambio

En `src/routes/checkout.tsx` (función `onSubmit`):

- Tratar como particular si `aseguradora === "Particular"` **o** `payParticularOverride === true`.
- En ese caso: limpiar `validationResult` y navegar directamente a `/pago`, sin llamar `runValidations`.

```ts
const isParticular = aseguradora === "Particular" || payParticularOverride === true;
if (isParticular) {
  setValidationResult(undefined);
  navigate({ to: "/pago" });
  return;
}
```

(`payParticularOverride` ya está siendo leído del store en el componente, no requiere imports nuevos.)

## Verificación

- Aseguradora "Particular" → continuar en `/checkout` → va a `/pago` (sin validar).
- Aseguradora EPS + en `/validacion` se elige "Tomar como particular" → si vuelve a pasar por `/checkout`, ya no se navega a `/validacion`, va directo a `/pago`.
- Aseguradora EPS sin override → comportamiento actual (corre validaciones).