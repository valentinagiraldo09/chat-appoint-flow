## Problema

El banner **"¿Quieres una cita antes?"** (en `src/routes/disponibilidad.tsx`) aparece de forma incorrecta para Ginecología · Primera vez · EPS Sura (estado-2) casi sin importar la fecha. Dos causas:

1. `particularSection` **inventa** la fecha preferida: cuando ese día no tiene cupo real, toma horarios "prestados" del siguiente día disponible pero los muestra como si fueran de la fecha preferida (`date: ymd(target)`). Así el banner siempre cree que hay cupo particular en la fecha preferida.
2. En el mock, **EPS y Particular comparten la misma disponibilidad** (`hasAvailability`/`generateSlots` no distinguen aseguradora). Por eso "no hay con la aseguradora pero sí con particular" nunca pasa realmente, y el disparo del banner queda atado solo a "la fecha preferida no tiene cupo".

Regla deseada (confirmada): el banner se muestra **solo cuando la fecha preferida tiene cupo Particular real Y la EPS Sura no tiene cupo ese día**.

## Solución

### 1. Canal de disponibilidad independiente para la EPS (mock)

En `src/mocks/availability.ts`, agregar un parámetro opcional `seedSuffix = ""` (no rompe llamadas existentes) a `hasAvailability`, `generateSlots` y `findNextAvailableDate`. El sufijo **solo** altera la semilla del PRNG; el precio sigue derivándose de `service` (no se afecta `"Primera vez"`).

Esto crea un conjunto de días Sura (`seedSuffix = "eps"`) distinto del conjunto general/Particular (`""`), de modo que existan días donde Particular sí tiene cupo y Sura no.

### 2. Secciones EPS de estado-2 usan el canal Sura

En `disponibilidad.tsx`, para `estado === "estado-2"`, `epsSection`, `nextSection` y `slotPool` pasan `seedSuffix = "eps"` a las funciones del mock (búsqueda de fecha y generación de horarios consistentes entre sí). El resto de estados y el calendario siguen con disponibilidad general.

### 3. `particularSection` refleja cupo real (sin "préstamo")

Quitar el forzado de la fecha preferida. Lógica nueva:
- Si la fecha preferida tiene cupo real → `particularSection.date = fecha preferida` con sus horarios reales.
- Si no tiene cupo → `particularSection.date = siguiente día disponible` (sin disfrazarlo como la fecha preferida).

Así, cuando el día preferido no tiene cupo, `ymd(particularSection.date) !== preferredDate` y el banner queda oculto (cumple la regla elegida).

### 4. Condición del banner

Se mantiene la estructura actual, que ahora resulta correcta con los cambios anteriores:
- `estado-2` y hay `preferredDate`
- `particularSection` tiene horarios reales y `ymd(particularSection.date) === preferredDate` (cupo Particular real ese día)
- `particularSection.date < epsSection.date` (Sura no tiene ese día; su cupo más cercano es posterior)

## Fechas de prueba (tras el cambio)

Combinación Ginecología · Primera vez · EPS Sura. Días donde Particular sí y Sura no (el banner debe aparecer):

```text
11 jun  -> Sura recién 17 jun   (banner: Particular el 11 jun)
14 jun  -> Sura recién 17 jun
2  jul  -> (1 jul Part / Sura 2 jul) usar 1 jul
8  jul  -> Sura recién 9 jul
```

Día con cupo Particular y Sura el mismo día → **no** aparece banner (correcto). Día sin cupo Particular → **no** aparece banner (correcto).

## Verificación

- Probar en preview con fecha preferida = 11 jun (banner visible, Particular el 11) y con una fecha donde Sura sí tiene cupo (sin banner).
- Confirmar que precios solo se muestran en Particular (sin regresiones del cambio previo).
- Revisar que calendario, horarios y validación siguen usando disponibilidad general (sin cambios de comportamiento).

## Archivos

- `src/mocks/availability.ts` — parámetro `seedSuffix` opcional.
- `src/routes/disponibilidad.tsx` — canal "eps" en secciones estado-2, `particularSection` sin préstamo, condición del banner.
