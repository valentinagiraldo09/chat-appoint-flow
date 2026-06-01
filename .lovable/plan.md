## Problema

En la pantalla de confirmación (`src/routes/confirmacion.tsx`) la barra fija inferior con "Total pago pendiente" aparece siempre que `paymentMethod === "clinic"`. El problema raíz está en `src/routes/checkout.tsx`: cuando la validación con la aseguradora es exitosa, el método de pago se decide así:

```text
const hasAmount = payParticularOverride || (slot.price ?? 0) > 0;
goConfirmacion(hasAmount ? "clinic" : "none");
```

Como **todos** los slots generados traen `price > 0` (ver `generateSlots` en `availability.ts`), una cita cubierta por la aseguradora también entra como `"clinic"` y muestra la barra de pago pendiente, aunque el paciente no deba pagar nada.

Confirmado con el usuario: una cita de aseguradora no tiene valor por pagar (sin copago por ahora).

## Cambio

En `src/routes/checkout.tsx`, dentro de `onSubmit`, ajustar la decisión del método de pago tras una validación `ok`:

- La cita solo es "pago pendiente" (`"clinic"`) cuando es un pago **particular** (es decir, `payParticularOverride === true`, que es el único caso donde el paciente paga el valor del slot).
- Cuando la cita queda cubierta por la aseguradora (validación `ok` sin override particular), el método debe ser `"none"` → "Cubierta por tu aseguradora", sin barra de pago.

Reemplazar:

```text
const hasAmount = payParticularOverride || (slot.price ?? 0) > 0;
goConfirmacion(hasAmount ? "clinic" : "none");
```

por:

```text
goConfirmacion(payParticularOverride ? "clinic" : "none");
```

La rama de aseguradora "Particular" (líneas 130-136) ya llama a `goConfirmacion("clinic")` y se mantiene igual, ya que esas citas sí tienen valor por pagar.

## Resultado esperado

- Cita particular (Particular o banner "cita antes" particular) → barra fija "Total pago pendiente: $..." con botón "Pagar ahora".
- Cita cubierta por aseguradora → sin barra de pago, solo "Pedir nueva cita" y mensaje "Cubierta por tu aseguradora".

No se toca la UI de `confirmacion.tsx`; ya reacciona correctamente según `paymentMethod`.