## Problema

En el cambio anterior, `ConfirmModal` siempre salta `/checkout` si `patient` existe en el store. Como `patient` se persiste en `sessionStorage`, en la PRIMERA selección de slot (ej. 10 de mayo) ya hay `patient` previo y el flujo brinca directo a `/validacion` o `/pago`, saltándose el formulario que el usuario espera ver la primera vez.

## Flujo deseado

1. Usuario elige slot del 10 de mayo → siempre va a `/checkout` (formulario de datos del paciente).
2. Llena formulario → continuar → corre validación → resultado `limite_paciente` (cubre desde 6 jun).
3. Click "Ver disponibilidad desde el 6 de junio con mi aseguradora" → `/disponibilidad` con `coverageMinDate` seteado.
4. Elige nuevo slot (≥ 6 jun) → como ya viene de un re-flujo post-validación, NO mostrar `/checkout` otra vez → correr validación → `ok` → `/pago`.

## Señal para distinguir los dos casos

Cuando el usuario hace click en "Ver disponibilidad desde el 6 de junio…" en `validacion.tsx`, `verConAseguradora` ya setea `coverageMinDate`. Esa es la señal natural: si `coverageMinDate` está definido, estamos en el re-flujo y debemos saltar `/checkout`.

## Cambio

En `src/components/ConfirmModal.tsx`, modificar el `onClick` de "Sí, avanzar":

- Leer también `coverageMinDate` del store (`useBooking((s) => s.coverageMinDate)`).
- Cambiar la condición `if (patient) { ... }` por `if (patient && coverageMinDate) { ... }`.
- En el resto de los casos (incluida la primera selección, aunque `patient` exista por sesión previa), navegar a `/checkout` como antes.

Adicionalmente, para mantener limpio el estado, en `src/routes/checkout.tsx` (si aplica) o tras correr la validación inicial, no es necesario tocar nada más: `coverageMinDate` solo se setea cuando el usuario explícitamente toma la opción de ver disponibilidad de la aseguradora desde la fecha permitida.

## Archivos

- `src/components/ConfirmModal.tsx` — añadir `coverageMinDate` al destructuring del store y ajustar la condición del `onClick` para saltar `/checkout` solo cuando `patient && coverageMinDate`.
