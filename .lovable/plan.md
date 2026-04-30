
# Ajustes al flujo de validación de cobertura

La implementación actual ya cubre el grueso del brief (validación post-formulario, loader de 1.2 s, tres escenarios, conservación del slot). Sin embargo, encontré varias desviaciones respecto a las reglas que enviaste. Este plan las corrige sin rehacer el flujo.

## Problemas detectados

1. **Mapeo de casos invertido en `coverage.ts`** (riesgo alto):
   - El brief define: Caso 1 = cubre, Caso 2 = no cubre, Caso 3 = cubre pero en otra fecha.
   - El mock actual usa: `case: 1` cubre, `case: 3` no cubre, `case: 2` cubre en otra fecha.
   - El checkout enruta `case 2 → /cobertura-fecha` y `case 3 → /cobertura-no`, lo cual funciona accidentalmente, pero los números no coinciden con la documentación. Esto va a confundir cualquier ajuste futuro.

2. **Sura debería usar el escenario "no cubre" puro (Escenario 2 del brief)**. Hoy lo hace, solo hay que renumerar.

3. **Compensar / Escenario 3**: el mensaje en `/cobertura-fecha` dice solo "la fecha más cercana...". El brief pide separar título y explicación: "Tu aseguradora cubre este servicio, pero no para la fecha seleccionada" + "La fecha más cercana disponible con cobertura de tu aseguradora es {fecha}".

4. **Botón "Ver citas cubiertas por mi aseguradora"** en `/cobertura-fecha`: hoy hace `setDate(suggestedDate)` y navega a `/disponibilidad`, pero **no marca al chat ni a la UI que esos resultados están filtrados por cobertura de aseguradora**. El usuario llega a disponibilidad sin contexto. Falta:
   - Un mensaje del bot en el chat: "Te muestro las citas con cobertura de {aseguradora} desde {fecha}".
   - Un badge/banner en `/disponibilidad` mientras `acceptedSuggestedDate` esté activo, indicando "Mostrando disponibilidad cubierta por {aseguradora}".
   - Activar `setAcceptedSuggestedDate(true)` (hoy se setea en `false` al entrar al checkout pero nunca en `true`).

5. **Confirmación cuando paga particular tras Escenario 2 o 3**: el brief no pide cambios visibles, pero hoy el badge "Cubierta por tu aseguradora" solo se muestra si `paymentMethod === "none"`. Está OK; solo verificar que no aparezca por error cuando `payParticularOverride` es true.

6. **Mensaje de loader y copys**: el brief insiste en evitar tecnicismos. Revisar que el botón diga "Validando cobertura..." (ya está) y que los títulos de las pantallas de decisión no usen palabras como "Cobertura no disponible" en `<title>` (es interno, aceptable, pero el H1 ya está bien).

7. **Chat bidireccional**: cuando el sistema enruta a `/cobertura-no` o `/cobertura-fecha`, el `ChatPanel` debe emitir un mensaje del bot explicando lo que pasó, para mantener la coherencia conversacional que ya implementamos en otros pasos.

## Cambios propuestos

### `src/mocks/coverage.ts`
- Renumerar el tipo `CoverageResult`:
  - `case: 1` → cubre (igual).
  - `case: 2` → no cubre (hoy es 3).
  - `case: 3` → cubre pero en otra fecha, incluye `suggestedDate` (hoy es 2).
- Ajustar las reglas de Sanitas (1), Sura (2), Compensar (1 o 3 según fecha).

### `src/routes/checkout.tsx`
- Actualizar el `switch` post-validación: `case 1 → confirmación`, `case 2 → /cobertura-no`, `case 3 → /cobertura-fecha`.
- Después de routear a las pantallas de decisión, hacer `pushChat` con un mensaje del bot que resuma el resultado (p. ej. "{Aseguradora} no cubre esta cita. Puedes pagar como particular o buscar otra.").

### `src/routes/cobertura-fecha.tsx`
- Cambiar el chequeo de `coverage.case !== 2` por `!== 3`.
- Reescribir el copy: título y subtítulo separados según brief.
- En `verCubiertas()`: hacer `setAcceptedSuggestedDate(true)`, `pushChat({ from: "bot", text: "Te muestro las citas con cobertura de {aseguradora} desde {fecha}." })` y luego navegar.

### `src/routes/cobertura-no.tsx`
- Cambiar el chequeo implícito de `coverage.case` para alinearse al nuevo número 2 (validar que solo se renderice si coverage.case === 2; hoy no valida, así que solo agregar el guard).
- En `pagarParticular()`: pushChat con "Continuamos con pago particular para tu cita seleccionada."
- En `buscarOtra()`: pushChat con "Vamos a buscar otra cita para {servicio}." y limpiar `selectedSlot` (ya lo hace).

### `src/routes/disponibilidad.tsx`
- Si `acceptedSuggestedDate === true` y `aseguradora` está definida, mostrar un banner superior:
  > Mostrando disponibilidad cubierta por **{aseguradora}** a partir del **{fecha}**.
- Botón secundario en el banner: "Ver todas las disponibles" → `setAcceptedSuggestedDate(false)` y `setDate(undefined)`.

### `src/routes/confirmacion.tsx`
- Asegurar que el badge "Cubierta por tu aseguradora" solo aparezca cuando `paymentMethod === "none"` y `payParticularOverride !== true` (ya cumple, solo añadir la segunda condición por defensa).

### `src/components/ChatPanel.tsx`
- (Opcional, ligero) Detectar si la ruta cambia a `/cobertura-no`, `/cobertura-fecha` o `/confirmacion` con cobertura, y empujar mensajes contextuales si aún no se hizo desde el origen. La ruta principal ya es generar los mensajes desde el callsite (checkout / pantallas de decisión), así que aquí solo se documenta.

## Detalles técnicos

- El renumerado del enum no rompe nada porque `CoverageResult` solo se construye en `coverage.ts` y se consume en checkout + las dos pantallas de decisión.
- `acceptedSuggestedDate` ya existe en el store; solo no se estaba activando.
- No se requieren nuevas rutas, ni cambios en `routeTree.gen.ts`, ni nuevas dependencias.
- No se modifica el flujo de Particular (sigue saltando validación y yendo directo a `/pago`).

## Pruebas manuales sugeridas

1. **Sanitas + Cardiología Primera vez** → loader → confirmación con badge "Cubierta por tu aseguradora", sin pasar por pago.
2. **Sura + cualquier servicio** → loader → `/cobertura-no` → "Pagar como particular" → `/pago`. También probar "Volver a buscar otra cita".
3. **Compensar + fecha < Ago 2026** → loader → `/cobertura-fecha` con copy correcto → "Ver citas cubiertas" → `/disponibilidad` con banner activo en Ago 2026 → seleccionar slot → checkout con Compensar → confirmación cubierta.
4. **Compensar + fecha ≥ Ago 2026** → loader → confirmación cubierta directa.
5. **Particular** → no muestra loader de cobertura, va directo a `/pago`.
6. Revisar que el chat acompañe cada decisión con un mensaje contextual.
