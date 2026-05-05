## Problema

En `/validacion`, la "Cita particular sugerida" se está calculando con `findNextAvailableDate(date)`, que salta a la próxima fecha con disponibilidad. Como la fecha preferida (7 de mayo) suele tener disponibilidad particular, debería usarse esa misma fecha; si no, recién entonces buscar la siguiente.

Adicionalmente, hoy `findParticularSlot` toma siempre `slots[0]` (primer horario del día). Si la fecha preferida tiene slots particulares, debe priorizarse la fecha del usuario, no el siguiente día.

## Cambio

Editar `src/routes/validacion.tsx`, función `findParticularSlot`:

1. Si se recibe `fromDate` (fecha preferida del store `useBooking().date`), intentar primero `generateSlots(fromDate, specialty, service)`.
2. Si hay slots ese día → devolver el primero.
3. Si no hay → caer al comportamiento actual (`findNextAvailableDate`).

No se requieren más cambios: `particularSlot` ya se invoca con `date ? parseYmd(date) : undefined`.

## Archivos

- `src/routes/validacion.tsx` — actualizar `findParticularSlot`.
