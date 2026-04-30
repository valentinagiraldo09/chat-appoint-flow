# Plan: Validaciones de cobertura por aseguradora

Mantener la disponibilidad libre de cobertura. La validación se ejecuta cuando el paciente envía el formulario de datos personales en `/checkout`. Según el resultado, el flujo se ramifica en 3 caminos.

## Cambios por archivo

### 1. `src/mocks/coverage.ts` — reglas deterministas más claras
Mantener `validateCoverage(aseguradora, specialty, service, slotDate)` (añadir `slotDate`) con estos casos simulados:
- **Particular** → no se llama validación, va directo a `/pago`.
- **EPS Sanitas** → caso 1 (cubre).
- **EPS Sura** → caso 3 (no cubre nunca → solo opción particular).
- **EPS Compensar**:
  - Si `slotDate < 2026-08-01` → caso 2 (cubre el servicio pero no la fecha; sugiere la primera disponibilidad ≥ Agosto 2026).
  - Si `slotDate ≥ 2026-08-01` → caso 1.
- Tipos: `case 1 | 2 | 3`. Caso 2 incluye `suggestedDate: string` (ymd).

### 2. `src/store/booking.ts` — sin cambios estructurales
Reutilizar `coverage`, `payParticularOverride`, `acceptedSuggestedDate`. Añadir helper `setDate` ya existe.

### 3. `src/routes/checkout.tsx` — loader y enrutamiento por caso
Reemplazar el banner inline `CoverageBanner` por navegación a una pantalla intermedia de decisión:
- Mantener el formulario y el loader actual ("Validando cobertura...") con duración ~1.2s.
- Tras `validateCoverage`:
  - **Particular** → `navigate("/pago")` directo.
  - **Caso 1 (cubre)** → set `paymentMethod = "none"`, generar `confirmationCode`, `navigate("/confirmacion")` directo. **No pasa por `/pago` ni por `/oportunidad`.**
  - **Caso 2 (cubre pero fecha posterior)** → `navigate("/cobertura-fecha")`.
  - **Caso 3 (no cubre)** → `navigate("/cobertura-no")`.
- Eliminar el componente `CoverageBanner` y la rama `proceed()` que iba a `/oportunidad`.

### 4. Nueva ruta `src/routes/cobertura-no.tsx` (caso 3)
Pantalla de decisión:
- Mensaje: "Tu aseguradora no cubre esta cita."
- Texto: "Puedes continuar como particular pagando el valor de la cita."
- Resumen breve del slot seleccionado (fecha, hora, profesional, sede, valor).
- Dos CTA:
  - **Pagar como particular** → set `payParticularOverride=true`, `navigate("/pago")`.
  - **Volver a buscar otra cita** → `navigate("/disponibilidad")` conservando `specialty` y `service` (no tocar el store salvo limpiar `selectedSlot`).

### 5. Nueva ruta `src/routes/cobertura-fecha.tsx` (caso 2)
Pantalla de decisión con dos caminos:
- Mensaje: "Tu aseguradora cubre este servicio, pero no para la fecha seleccionada."
- Subtexto: "La fecha más cercana disponible con cobertura de tu aseguradora es {suggestedDate}."
- Resumen de la cita actual.
- Dos CTA:
  - **Ver citas cubiertas por mi aseguradora** → `setDate(suggestedDate)`, limpiar `selectedSlot`, `navigate("/disponibilidad")`.
  - **Pagar como particular y conservar esta cita** → set `payParticularOverride=true`, `navigate("/pago")`.

### 6. `src/routes/confirmacion.tsx` — etiqueta de cobertura
Cuando `paymentMethod === "none"` (cubierta por aseguradora), mostrar un badge verde:
"Estado: Cubierta por tu aseguradora" en el bloque de detalles, encima del valor. Asegurar que el resumen incluya: Servicio, Profesional, Fecha, Hora, Tipo de atención (`slot.attention`), Aseguradora, Estado. Los seis ya existen salvo "Estado", se añade.

### 7. `src/routeTree.gen.ts`
Lo regenera el plugin de TanStack Router al añadir los archivos de ruta nuevos.

## Flujo resultante

```text
/checkout (submit)
  └─ loader 1.2s → validateCoverage
       ├─ Particular        → /pago
       ├─ Caso 1 (cubre)    → /confirmacion (sin pago)
       ├─ Caso 2 (fecha)    → /cobertura-fecha
       │     ├─ Ver cubiertas  → /disponibilidad (date=suggested)
       │     └─ Pagar particular → /pago
       └─ Caso 3 (no cubre) → /cobertura-no
             ├─ Pagar particular → /pago
             └─ Volver a buscar  → /disponibilidad
```

## Notas

- En todos los caminos donde el usuario opta por particular, `selectedSlot` se conserva intacto.
- En "Ver citas cubiertas" (caso 2), se cambia `date` y se limpia `selectedSlot` para que `/disponibilidad` recalcule.
- La ruta `/oportunidad` deja de usarse después de validación de cobertura; queda accesible solo si en el futuro se vuelve a enrutar (no se elimina en este cambio).
- Mensajes en lenguaje claro, sin "validación fallida" ni jerga técnica.
- Cada transición que dispare validación o búsqueda usa loader visible.
