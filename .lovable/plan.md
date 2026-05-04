## Objetivo

Hacer que los chips de filtros en P1 (Sede, Profesional, Tipo de atención, Franja) se recalculen entre sí: al activar uno, los demás solo muestran opciones que producen al menos un slot real, evitando combinaciones imposibles.

## Cambios

### 1. `src/mocks/availability.ts`
Agregar helper `opcionesFiltro(slots, filters, key)`:
- Toma todos los slots del día/sección activa.
- Aplica todos los filtros activos **excepto** `key`.
- Devuelve el conjunto único de valores presentes en ese campo (`sede`, `profesional`, `attention`, o `franja` derivada de `franjaForHour(hour)`).

### 2. `src/routes/disponibilidad.tsx`
- Calcular un pool de slots base para opciones: usar la primera fecha visible (la fecha seleccionada, o la primera disponible si no hay fecha) con `generateSlots(date, specialty, service)` **sin aplicar filtros**.
- Pasar ese pool al `FiltersBar` vía prop `slotPool`.

### 3. `src/components/FiltersBar.tsx`
- Aceptar prop `slotPool: Slot[]`.
- Para cada filtro, calcular sus opciones con `opcionesFiltro(slotPool, filters, key)` en lugar de usar las constantes completas (`SEDES`, `PROFESIONALES`, etc.).
- Si una opción ya seleccionada queda fuera del nuevo set (porque otro filtro la invalida), seguir mostrándola marcada para permitir limpiarla, pero los demás items se ocultan.
- Si un filtro tiene 0 opciones disponibles, deshabilitar el chip (cursor-not-allowed, opacidad reducida).

### 4. Comportamiento de "franja"
Como `franja` no es campo directo del slot, derivarla con `franjaForHour(slot.hour)` dentro de `opcionesFiltro`.

## Detalles técnicos

- El pool se memoiza con `useMemo` dependiendo de `date`, `specialty`, `service` para no regenerar en cada render.
- El recálculo de opciones por chip ocurre en cada render del dropdown (operación O(n) sobre ~14 slots, trivial).
- No se modifica `generateSlots` ni el RNG: el cruce ocurre solo sobre el resultado.
- No hay campo `sinDisponibilidad` en los datos actuales; queda fuera del scope (los días sin disponibilidad ya retornan `[]` desde `hasAvailability`).
