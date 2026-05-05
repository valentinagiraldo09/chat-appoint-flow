## Cambio

Siempre llevar a `/checkout` desde `ConfirmModal`. En `/checkout`, pre-rellenar el formulario con los datos del paciente si ya existen en el store, para que el usuario solo tenga que dar "Continuar".

## Archivos

### `src/components/ConfirmModal.tsx`

Simplificar el `onClick` del botón "Sí, avanzar":
- Quitar toda la lógica condicional con `patient`, `coverageMinDate`, `runValidations`, etc.
- Quedar solo: `setSelectedSlot(slot); onOpenChange(false); navigate({ to: "/checkout" });`
- Limpiar imports no usados (`runValidations`) y selectores del store que ya no se necesitan (`patient`, `payParticularOverride`, `setValidationResult`, `coverageMinDate`).

### `src/routes/checkout.tsx`

Pre-rellenar el formulario con `patient` del store:
- Leer `const patient = useBooking((s) => s.patient);`.
- En `useForm`, calcular `defaultValues` desde `patient` cuando exista; `acceptTerms` también queda en `true` si ya hay `patient` (ya aceptó previamente).
- Añadir un `useEffect` que llame `form.reset(...)` cuando cambia `patient`, para cubrir el caso de que el componente se monte sin patient y luego cambie (defensivo).

Resultado: la primera vez el formulario está vacío; en visitas posteriores ya viene lleno y el usuario solo confirma con "Continuar", lo que dispara la validación normal.
