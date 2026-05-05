## Objetivo

`preferredDate` debe ser la fecha que efectivamente se muestra como primera disponibilidad en P1 (`/disponibilidad`). Cuando el usuario eligió un chip o una sugerencia (sin fecha exacta), esa fecha es la primera fecha con disponibilidad a partir del inicio del rango del chip — no la fecha base del chip por sí sola, ya que esta puede no tener cupo.

## Cambio

En `src/routes/index.tsx`, función `finishAgendar`, reemplazar:

```ts
const resolvedISO = d.dateISO ?? (d.dateKey ? dateChipToISO(d.dateKey) : undefined);
if (d.dateKey) setPreferredDate(d.requestedDateISO ?? resolvedISO);
useBooking.getState().setDate(resolvedISO);
```

por:

```ts
const resolvedISO = d.dateISO ?? (d.dateKey ? dateChipToISO(d.dateKey) : undefined);
let preferred: string | undefined = d.requestedDateISO ?? d.dateISO;
if (!preferred && d.specialty && d.service) {
  const start = resolvedISO ? parseYmd(resolvedISO) : new Date();
  start.setHours(0, 0, 0, 0);
  const firstAvail = findNextAvailableDate(start, d.specialty, d.service);
  if (firstAvail) preferred = ymd(firstAvail);
}
if (preferred) setPreferredDate(preferred);
useBooking.getState().setDate(resolvedISO);
```

`findNextAvailableDate`, `parseYmd` y `ymd` ya están importados desde `@/mocks/availability` (línea 14).

## Resultado

- "Elegir fecha" + fecha exacta → `preferredDate` = esa fecha.
- Cualquier chip o sugerencia ("Lo más pronto", "Esta semana", etc.) → `preferredDate` = primera fecha con cupo desde el inicio del rango = la que P1 muestra como primera disponibilidad. Esto se propaga al CTA "Ver más disponibilidad" en `/validacion` y al P1 particular.