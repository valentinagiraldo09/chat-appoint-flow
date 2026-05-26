# Plan: eliminar /pago y mover la decisión de pago a la barra fija de /confirmacion

## Objetivo
La pantalla `/pago` deja de existir en el flujo. En **todos los casos** (Particular, EPS con copago/cuota, EPS cubierta), la cita se confirma directamente y la decisión de pago vive en la **barra inferior fija** de `/confirmacion`. El botón **Pagar ahora** abre el `IzipayModal` ahí mismo. El tono de copy se mantiene parecido al `/pago` actual.

## Cambios

### 1. `src/routes/checkout.tsx` — saltar `/pago`
En `onSubmit` y tras la validación:

- Caso **Particular** (sin validaciones): generar `confirmationCode`, `setPaymentMethod("clinic")` (pago pendiente) y navegar a `/confirmacion`.
- Caso **validación OK con `payParticularOverride`**: igual que Particular → `/confirmacion` con pago pendiente.
- Caso **validación OK normal (EPS)**:
  - Si `slot.price > 0` → `setPaymentMethod("clinic")` (pago pendiente) y `/confirmacion`.
  - Si `slot.price === 0` o sin valor a pagar → `setPaymentMethod("none")` y `/confirmacion`.
- Caso **validación distinta de ok** (`limite_paciente`, `sin_cobertura`): sigue yendo a `/validacion` igual que hoy.

Generar `confirmationCode` en checkout en lugar de en `/pago`.

### 2. `src/routes/confirmacion.tsx` — barra fija con decisión de pago
Reescribir la barra inferior fija según `paymentMethod`:

- **`clinic` (pago pendiente)** — layout estilo referencia adjunta:
  - Izquierda: 💳 **Total pago pendiente: {formatCOP(slot.price)}**
  - Subtítulo (tono `/pago` actual): _"Paga ahora y ahorra tiempo en filas largas el día de tu consulta."_
  - Derecha: outline **Pedir nueva cita** + primario **Pagar ahora**.
  - **Pagar ahora** abre `IzipayModal` (ya montado en la página). En `onSuccess` → `setPaymentMethod("online")` y cerrar modal. La barra cambia sola al estado pagado.

- **`online` (pagado)**: barra simple centrada con **Pedir nueva cita**.
- **`none` (cubierto por EPS)**: barra simple centrada con **Pedir nueva cita**.

Quitar el botón inline "Pagar ahora" dentro de la card de la cita (ahora vive en la barra).

Mantener intactos: card de la cita, datos del paciente, recomendaciones, estados visuales `isPaid` / `isPendingClinic` / `isCovered`, descargas (PDF/ICS/imprimir).

### 3. `src/routes/pago.tsx` — desactivar la ruta
Reemplazar el componente por un redirect inmediato a `/confirmacion` si llega alguien por URL directa. No borrar el archivo en esta iteración para no tocar `routeTree.gen.ts` manualmente (la regeneración del router lo limpia luego si decidimos eliminarla).

### 4. Sin cambios
- `ConfirmModal.tsx` (la lógica de `payParticularOverride` para estado-3 se mantiene; ya no afecta a qué pantalla se navega, solo a que no se corra validación de EPS).
- `validations.ts`, `disponibilidadStates.ts`.
- `store/booking.ts` (ya tiene `paymentMethod` y `confirmationCode`).

## Copy final de la barra (estado pago pendiente)
- Título: **Total pago pendiente: {monto} COP**
- Subtítulo: _Paga ahora y ahorra tiempo en filas largas el día de tu consulta._
- CTAs: **Pedir nueva cita** (outline) · **Pagar ahora** (primario)

## QA
1. **Particular** → checkout → directo a `/confirmacion` con barra de pago pendiente → "Pagar ahora" abre Izipay → success → barra pasa a estado pagado.
2. **EPS con valor (estado-1/2 ok)** → checkout → `/confirmacion` con barra de pago pendiente → Izipay funciona igual.
3. **EPS cubierta sin valor** → checkout → `/confirmacion` con barra simple (solo "Pedir nueva cita").
4. **Documento 11/22/00/33 con EPS** → sigue cayendo en `/validacion` (no cambia).
5. Navegar manualmente a `/pago` → redirige a `/confirmacion`.
