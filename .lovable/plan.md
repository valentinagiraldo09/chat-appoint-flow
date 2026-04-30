
# Validación de cobertura — alineación con los 3 escenarios

La lógica ya existe parcialmente en `checkout.tsx` + `coverage.ts`, pero el flujo, los mensajes y las rutas de decisión no coinciden con lo pedido. Vamos a refactorizar **sin tocar la pantalla de disponibilidad** (allí no hay validación de aseguradora, eso ya está bien).

## Cambios principales

### 1. `src/mocks/coverage.ts` — reglas deterministas + dependientes de la fecha del slot

Hoy `validateCoverage` no recibe la fecha del slot, por eso EPS Sura siempre devuelve "fecha futura". Lo cambiamos a:

```text
validateCoverage(aseguradora, specialty, service, slotDate)
  → case 1 "cubierta"     (Sanitas; Sura cuando slotDate ≥ Agosto 2026; Compensar salvo Primera vez)
  → case 2 "cubre pero no en esa fecha" + suggestedDate
                          (Sura cuando slotDate < Agosto 2026)
  → case 3 "no cubre"     (Sura para servicios específicos como Cardiología Primera vez;
                           Compensar Primera vez)
```

Reglas mock concretas:
- `Particular` → no se valida, va directo a pago.
- `EPS Sanitas` → Caso 1 siempre.
- `EPS Sura` → Caso 3 si servicio = `Primera vez` y especialidad = `Cardiología`. Si no, Caso 1 cuando `slotDate ≥ 2026-08-01`, Caso 2 en otro caso (sugerir el primer día disponible desde 2026-08-01).
- `EPS Compensar` → Caso 3 para `Primera vez`; Caso 1 en lo demás.

### 2. `src/routes/checkout.tsx` — loader dedicado + branching limpio

- Al hacer "Continuar", ocultar el formulario y mostrar un **loader pantalla completa** (centrado, con copy "Validando cobertura con tu aseguradora…", ~1.2s).
- Tras el loader, según el caso:
  - **Caso 1 (cubre)** → `setPaymentMethod("none")`, generar `confirmationCode`, navegar a `/confirmacion`. **Nunca pasa por `/pago`.**
  - **Caso 2 (cubre pero no en esa fecha)** → navegar a nueva ruta `/cobertura/parcial`.
  - **Caso 3 (no cubre)** → navegar a nueva ruta `/cobertura/no-cubre`.
- Eliminar el banner inline `CoverageBanner` (los 3 casos pasan a ser pantallas dedicadas, más claros y accionables).
- Quitar el paso intermedio `/oportunidad` del flujo principal de cobertura — ya no se usa después del checkout (queda accesible solo si se decide mantenerlo internamente, pero los flujos descritos no lo requieren).

### 3. Nueva ruta `src/routes/cobertura.no-cubre.tsx` (Caso 3)

Pantalla de decisión:
- Título: "Tu aseguradora no cubre esta cita"
- Subtexto: "Puedes continuar como particular pagando el valor de la cita, o volver a buscar otra cita."
- Resumen compacto del slot seleccionado (servicio, fecha, hora, profesional, sede, valor particular).
- CTAs:
  - **Pagar como particular** → `setPayParticularOverride(true)` → `/pago` (mantiene el slot original).
  - **Volver a buscar otra cita** → conserva `specialty`, `service`, limpia `selectedSlot` → `/disponibilidad`.

### 4. Nueva ruta `src/routes/cobertura.parcial.tsx` (Caso 2)

Pantalla de decisión:
- Título: "Tu aseguradora cubre este servicio, pero no para la fecha seleccionada"
- Subtexto: "La fecha más cercana disponible con cobertura de tu aseguradora es el {suggestedDate}."
- Dos cards:
  - **Ver citas cubiertas por mi aseguradora** → `setDate(suggestedDate)`, marca un flag de filtro "solo cubiertas" y navega a `/disponibilidad`. Mensaje en `ChatPanel` indicando el cambio.
  - **Pagar como particular y conservar esta cita** → `setPayParticularOverride(true)` → `/pago`.
- Banner inferior tranquilizador: "No pierdes tu cita seleccionada — puedes volver en cualquier momento."

### 5. `src/routes/disponibilidad.tsx` — soporte para "solo cubiertas"

Cuando se llega desde Caso 2 con `coverageOnly = true`:
- `FiltersBar` muestra un chip extra "Solo cubiertas por {aseguradora}" (removible).
- `ChatPanel` envía mensaje del bot: "Mostrando disponibilidad cubierta por {aseguradora} desde {fecha}".
- En el mock de filtrado, los slots se siguen generando igual; el chip es informativo + filtra fechas previas a `suggestedDate`. No se rompe el resto del flujo.

### 6. Store (`src/store/booking.ts`)

- Añadir `coverageOnly?: boolean` y `coverageMinDate?: string` en filtros (o como flags top-level).
- Añadir `clearSelectedSlot()` ya cubierto por `setSelectedSlot(undefined)`.
- No persistir nada nuevo crítico — sigue en sessionStorage.

### 7. `src/routes/pago.tsx`

- Quitar la rama "needsPay = false" (porque cuando hay cobertura ya no entramos a `/pago`). Se asume siempre pago particular en esta pantalla. Simplifica el copy.

### 8. Confirmación (`src/routes/confirmacion.tsx`)

- Añadir badge de estado dentro del resumen:
  - **"Cubierta por tu aseguradora"** (verde) cuando `paymentMethod === "none"`.
  - **"Pago particular en línea"** o **"Pago particular en clínica"** según corresponda.
- Mostrar `Tipo de atención` (presencial / telemedicina) explícitamente.

## Detalles técnicos

- **Routing TanStack**: nuevos archivos `src/routes/cobertura.no-cubre.tsx` y `src/routes/cobertura.parcial.tsx` (convención dot-separated → `/cobertura/no-cubre` y `/cobertura/parcial`). El plugin regenera `routeTree.gen.ts` automáticamente.
- **Loader en checkout**: estado `validating` ya existe; lo elevamos a una vista de pantalla completa en lugar de un spinner pequeño en el botón. Duración 1100–1400ms aleatoria para que se sienta real.
- **Fecha sugerida Sura**: `findNextAvailableDate(new Date("2026-08-03"), specialty, service)` para que caiga en un día con slots reales del mock.
- **Persistencia del slot**: en Caso 2 / Caso 3, el `selectedSlot` se conserva siempre. Solo se limpia si el usuario explícitamente elige "Volver a buscar otra cita".
- **Sincronización chat ↔ filtros**: aprovechamos `setFilter(key, value, "chat")` ya existente en el store; el `ChatPanel` ya escucha cambios de filtros y notifica.

## Flujo resultante

```text
/disponibilidad → /horarios (slot)
       ↓
/checkout (formulario + aseguradora)
       ↓ click "Continuar"
[loader pantalla completa: "Validando cobertura…"]
       ↓
   ┌───┴────────────────────────────────┐
Caso 1                Caso 2                Caso 3
  ↓                     ↓                     ↓
/confirmacion   /cobertura/parcial    /cobertura/no-cubre
(cubierta)      ┌────┴─────┐          ┌────┴─────┐
              ver cubiertas  pagar    pagar     volver a
                  ↓        particular particular  buscar
            /disponibilidad   ↓          ↓          ↓
            (date=Ago 2026)  /pago      /pago   /disponibilidad
                              ↓          ↓
                       /confirmacion  /confirmacion
```

## Archivos a tocar

- Editar: `src/mocks/coverage.ts`, `src/routes/checkout.tsx`, `src/routes/pago.tsx`, `src/routes/confirmacion.tsx`, `src/routes/disponibilidad.tsx`, `src/components/FiltersBar.tsx`, `src/components/ChatPanel.tsx`, `src/store/booking.ts`.
- Crear: `src/routes/cobertura.no-cubre.tsx`, `src/routes/cobertura.parcial.tsx`.

## Fuera de alcance

- No se modifica P0 (asistente) ni P1 (disponibilidad inicial) salvo el chip "solo cubiertas".
- No se reemplaza el sistema de pago mock.
- No se persiste en backend (sigue todo en `useBooking` con sessionStorage).
