## Problema

En `src/routes/index.tsx`, al escribir "quiero agendar una cita":

1. `detectIntent` correctamente detecta `agendar`.
2. `detectSpecialty` también se ejecuta y, por el fuzzy matching con tolerancia a typos (Levenshtein), la palabra **"cita"** (4 letras) coincide con **"vista"** (5 letras, tolerancia 2, distancia 1) → devuelve `Optometría`.
3. Resultado: el flujo arranca con la especialidad ya "elegida" y salta directo a preguntar el servicio.

Lo mismo puede pasar con otras keywords cortas/ambiguas (`derma`, `gineco`, `cardio`, `ojos`, etc.) frente a palabras comunes del usuario.

## Solución

Endurecer la detección de **especialidad** y **EPS** para que no usen fuzzy con palabras cortas, sin tocar el resto del parser ni la UX.

Cambios mínimos en `src/routes/index.tsx`:

1. **Nuevo helper `strictMatch`** (substring exacto sobre texto normalizado, sin Levenshtein), o reusar solo la 1ª pasada de `fuzzyMatch`.
2. **`detectSpecialty`**: usar `strictMatch` en vez de `fuzzyMatch`. Las keywords ya cubren variantes habituales ("cardio", "derma", "gineco", "optome", "pediatra"…). Si el usuario escribe con typo grave, simplemente caerá al paso de elegir especialidad — comportamiento deseado.
3. **`detectEPS`**: igual, `strictMatch`. Los nombres de EPS son marcas; no necesitan fuzzy.
4. **`detectIntent` y `detectService`**: se mantienen con fuzzy (los verbos sí necesitan tolerancia: "agenda" / "agendar" / "ajendar").
5. Adicional defensivo: en `detectSpecialty` ignorar la keyword si el texto contiene la palabra "cita"/"citas" como única coincidencia con "vista" (cubierto ya por el cambio a strict).

## Resultado esperado

- "quiero agendar una cita" → intent `agendar`, sin especialidad → P0 pregunta "¿Qué especialidad necesitas?".
- "quiero una cita de optometría" → intent `agendar` + specialty `Optometría` → salta a servicio (comportamiento correcto previo, se mantiene).
- "agéndame con cardio" → intent `agendar` + specialty `Cardiología` (substring de "cardio") → se mantiene.

## Archivos a modificar

- `src/routes/index.tsx` (solo lógica de parsing, ~10 líneas).

No hay cambios en mocks, store, ni en otras rutas.
