## P5 — Validaciones tras "Continuar" en /checkout

### 1. Mock de validaciones — `src/mocks/validations.ts` (nuevo)
Función `runValidations({ documento, aseguradora, specialty, service, slot })` con reglas deterministas:
- doc termina en `00` → `lista_negra` (tel "01 8000 123 456")
- doc termina en `11` → `limite_paciente` (fecha permitida = hoy+30, ajustada al próximo día con disponibilidad)
- `Cardiología + Primera vez` con EPS ≠ Particular → `sin_cobertura`
- `Pediatría + EPS Sura + Primera vez` → `sin_disponibilidad`
- resto → `ok`
- aseguradora `Particular` o flag bypass → siempre `ok`

### 2. Store — `src/store/booking.ts`
Añadir `validationResult?: ValidationResult` y `setValidationResult`.

### 3. `/checkout`
- Quitar el hardcode `setAseguradora("Particular")` y `setPayParticularOverride(true)`.
- En `onSubmit`: si `payParticularOverride` ya estaba activo (vino de card particular en P3 estado‑3) → directo a `/pago`.
- Si no: mostrar pantalla "Verificando…" (~1500 ms), correr `runValidations`, guardar resultado, navegar a `/validacion`.

### 4. Nueva ruta `src/routes/validacion.tsx` (P5)
Render por rama, siempre ≥1 acción:

- **ok** → banner verde + "Confirmar cita" → `/pago`.
- **limite_paciente** → mensaje con fecha permitida.
  - Primaria: "Ver opciones con mi aseguradora" (setea `coverageOnly`, `coverageMinDate`, `setDate`, va a `/disponibilidad`).
  - Card slot particular sugerido por $X → `/pago` con override. Link "Ver más opciones particulares".
- **lista_negra** → "Tu aseguradora no tiene cobertura con nosotros. Comunícate al [tel]." (sin mencionar lista negra).
  - Primaria: "Tomar esta cita como particular por $X" → `/pago` con override.
  - Secundaria: "Ver más opciones particulares" → `/disponibilidad` con override.
- **sin_cobertura** → card slot particular por $X → `/pago`. Botón "Ver disponibilidad con mi aseguradora" (`coverageOnly`). Secundaria: "Lista de espera" (`WaitlistDialog`).
- **sin_disponibilidad** → "No encontramos disponibilidad…" + único CTA "Inscribirme en lista de espera" (`WaitlistDialog`).

### Archivos
- nuevo: `src/mocks/validations.ts`, `src/routes/validacion.tsx`
- edit: `src/store/booking.ts`, `src/routes/checkout.tsx`
