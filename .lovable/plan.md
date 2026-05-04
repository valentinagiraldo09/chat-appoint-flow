## Implementar los 4 estados de disponibilidad en P1

### 1. Mapa de estados (`src/mocks/coverage.ts` o nuevo `src/mocks/disponibilidadStates.ts`)

Agregar la tabla determinística:

```ts
export type DispEstado = "estado-1" | "estado-2" | "estado-3" | "estado-4";

const DISPONIBILIDAD: Record<string, DispEstado> = {
  "Dermatología|Nueva EPS":   "estado-1",
  "Medicina General|EPS Sanitas": "estado-1",
  "Ginecología|EPS Sura":     "estado-2",
  "Pediatría|Fomag":          "estado-2",
  "Optometría|Nueva EPS":     "estado-3",
  "Dermatología|Fomag":       "estado-3",
  "Pediatría|EPS Sura":       "estado-4",
  "Ginecología|Nueva EPS":    "estado-4",
};

export function getEstadoDisponibilidad(specialty?: string, aseguradora?: string): DispEstado {
  if (!specialty || !aseguradora) return "estado-1";
  return DISPONIBILIDAD[`${specialty}|${aseguradora}`] ?? "estado-1";
}
```

Agregar `"Fomag"` a `EPS_OPTIONS` en `src/mocks/catalog.ts` para poder seleccionarlo en P0/P1.

### 2. Refactor de `P1` en `src/routes/disponibilidad.tsx`

Calcular el estado y renderizar uno de cuatro layouts según `getEstadoDisponibilidad(specialty, aseguradora)`:

- **Estado 1 — EPS con disponibilidad**
  - Header: `${specialty} · ${service}` y `${aseguradora} · Esta semana`
  - Una sola card "Próxima disponibilidad" con la fecha más próxima y sus slots (los actuales).
  - No mostrar card particular, no mostrar precio en los slots EPS (ocultar `price` cuando el estado lo indique).

- **Estado 2 — EPS + particular más cercana**
  - Card principal "Próxima disponibilidad con tu aseguradora" usando `findNextAvailableDate(...)` con offset (ej. +10 días para simular EPS lejana).
  - Card complementaria con borde amarillo `#FFA800`, ícono ⚡, título "¿Quieres una cita antes?", subtítulo con la fecha particular más cercana (la `findNextAvailableDate` real). Slot único con precio visible. Link "Ver más opciones particulares".

- **Estado 3 — Sin cobertura, solo particular**
  - Banner amarillo arriba: "Tu aseguradora no tiene cobertura para este servicio en este centro. Te mostramos la disponibilidad disponible."
  - Una sola card "Disponibilidad particular" con slots (precios visibles).

- **Estado 4 — Sin disponibilidad (vacío)**
  - Estado vacío centrado: ícono calendario outline 48px, título "No encontramos disponibilidad", texto con `${service}` y `${aseguradora}`, dos botones:
    - "Buscar en otras fechas" → abre el `DatePickerField` (popover del calendario) o navega a `/horarios`.
    - "Inscribirme en lista de espera" → modal simple con confirmación.

Notas técnicas:
- Para diferenciar slots "EPS" vs "particular" se reutiliza `generateSlots`; el flag `mostrarPrecio` viene del estado actual (oculto en estado 1, visible en estado 2-card complementaria y estado 3).
- En `SlotCard` añadir prop opcional `hidePrice?: boolean`.
- Para estado 2 usar dos llamadas a `generateSlots` con semillas distintas (offset de fecha) para forzar fecha EPS más lejana que la particular.
- Para estado 4 omitir la grilla de slots y `FiltersBar`, mostrar solo el estado vacío + searchbar arriba intacto.

### 3. Confirmación inline al seleccionar slot

`ConfirmModal.tsx` ya existe; agregar al detalle:
- Aseguradora (desde `useBooking.aseguradora`).
- Dirección de la sede (`SEDE_ADDRESSES[slot.sede]`).
- Modalidad (ya está como `attention`).

### 4. Lista de espera

Nuevo componente `WaitlistDialog` (basado en `Dialog`): nombre + teléfono + botón "Inscribirme". Al confirmar, `pushChat` con mensaje del bot "Te avisaremos cuando haya disponibilidad" y cerrar.

---

## Guía de prueba (entregable al usuario tras implementar)

Texto que daré como respuesta final cuando el código esté hecho:

```
GUÍA DE PRUEBA

CASO 1 — Flujo ideal (Estado 1)
  En P0: Dermatología · Primera vez + Nueva EPS · Esta semana
  Esperado: card única "Próxima disponibilidad" con slots EPS,
  sin precios, sin card particular. Click en slot abre confirmación.

CASO 2 — Anticipa opción mejor (Estado 2)
  En P0: Ginecología · Primera vez + EPS Sura
  Esperado: card EPS con fecha más lejana + card amarilla
  "¿Quieres una cita antes?" con un slot particular (con precio)
  en fecha previa.

CASO 3 — Sin cobertura (Estado 3)
  En P0: Optometría · Primera vez + Nueva EPS
  Esperado: banner amarillo "Tu aseguradora no tiene cobertura..."
  + única card "Disponibilidad particular" con precios visibles.

CASO 4 — Sin disponibilidad (Estado 4)
  En P0: Pediatría · Primera vez + EPS Sura
  Esperado: estado vacío con ícono calendario, texto contextual y
  dos botones: "Buscar en otras fechas" (abre calendario) e
  "Inscribirme en lista de espera" (abre modal).

CASO DEFAULT — Cualquier otra combinación cae a Estado 1.
```
