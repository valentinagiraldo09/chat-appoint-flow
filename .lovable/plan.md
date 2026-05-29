# Editar selecciones durante la conversación

## Problema
En `/` (`src/routes/index.tsx`) el flujo de agendar avanza por pasos (especialidad → servicio → EPS → fecha). Cada elección queda fija como burbuja y solo se muestran los chips del paso actual. Si el usuario se equivocó al elegir aseguradora, servicio o subservicio, no tiene cómo corregirlo.

## Solución (editar + texto libre)
Dos mecanismos complementarios, ambos dentro del flujo de agendar:

### 1. Resumen editable con botones
Mostrar, mientras `flow === "agendar"`, un panel compacto con las selecciones ya confirmadas del `draft` (especialidad, servicio, EPS, fecha). Cada chip confirmado lleva un ícono de lápiz; al hacer clic reabre ese paso puntual reutilizando los chips existentes.

- Se renderiza encima de `ChipsRow`, en el área de mensajes (antes del input).
- Cada entrada muestra el valor actual + botón "editar".
- Al editar un paso anterior (p. ej. especialidad), si el servicio ya no aplica a la nueva especialidad, se limpia el servicio para volver a pedirlo.
- Tras editar, el asistente confirma el cambio con una burbuja corta ("Listo, cambié la aseguradora a EPS Sura").

### 2. Corrección por texto libre
Permitir que en cualquier momento del flujo el usuario escriba correcciones como "cambia mi EPS a Sura", "mejor control", "que sea dermatología". El parser ya detecta especialidad/servicio/EPS/fecha; se ajusta `handleSend` para:
- Detectar intención de corrección (palabras como "cambia", "mejor", "en realidad", "no, "), y aplicar el valor detectado al campo correspondiente del `draft`.
- Confirmar el cambio con una burbuja del bot en vez de saltar al siguiente paso, y luego continuar el flujo.

## Cambios técnicos (`src/routes/index.tsx`)

1. **Nueva función `editStep(step)`**: setea `agStep` al paso pedido, emite una burbuja del bot ("¿Cuál prefieres?") y deja que `ChipsRow` muestre los chips de ese paso. Si se edita especialidad, validar/limpiar `service` cuando no pertenezca a la nueva especialidad.

2. **Nuevo subcomponente `EditableSummary`**: recibe `draft` y callbacks `onEdit(step)`; renderiza chips de los campos ya definidos con botón de lápiz. Se inserta en el render del chat (estado 2) cuando `flow === "agendar"`.

3. **Ajuste en `pickSpecialty/pickService/pickEPS/pickDate`**: tras una edición (cuando el paso editado no es el "siguiente" natural), confirmar con `botSay` y recalcular `nextAgendarStep` para no romper el orden.

4. **Ajuste en `handleSend` (rama `flow === "agendar"`)**: cuando el texto detecta un valor para un campo ya lleno, tratarlo como corrección — actualizar `draft`, emitir burbuja de confirmación, y continuar con `nextAgendarStep`.

## Alcance
- Solo afecta el flujo de agendar en `src/routes/index.tsx` (presentación + lógica de pasos del chat).
- No cambia el store, las rutas posteriores, ni el `ChatPanel` lateral.

## QA
- Elegir especialidad/servicio/EPS, luego usar el lápiz de cada uno para cambiarlo y verificar que el chip y la confirmación se actualicen.
- Cambiar especialidad y comprobar que el servicio se vuelve a pedir si no aplica.
- Escribir "cambia mi EPS a Sura" tras haberla elegido y verificar la corrección.
- Completar el flujo tras editar y confirmar que llega bien a `/disponibilidad`.
