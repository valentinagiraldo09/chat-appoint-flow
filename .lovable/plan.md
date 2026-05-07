## Objetivo

Simplificar los mensajes del bot en `src/routes/index.tsx` para que sean más cortos y directos, sin perder claridad sobre qué se está preguntando.

## Cambios de copy (antes → después)

**Flujo agendar:**
- "Perfecto. ¿Qué especialidad necesitas?" → "¿Qué especialidad necesitas?"
- "Genial, busquemos disponibilidad para {esp}. ¿Es primera vez o es un control?" → "¿Primera vez o control?"
- "¿Con qué aseguradora o EPS vas a tomar la cita?" → "¿Con qué EPS?"
- "¿Desde cuándo quieres tu cita?" → "¿Para cuándo?"
- "Listo. Tengo todo lo que necesito. Voy a mostrarte la disponibilidad disponible para ti." → "Listo, te muestro la disponibilidad."
- "Entendido, te ayudo a agendar tu cita de {esp}." → "Agendamos {esp}."

**Identificación (reagendar/cancelar/confirmar/pagar):**
- "Para reagendar necesito identificarte. ¿Cuál es tu número de documento?" → "Para reagendar, ¿tu número de documento?"
- "Para cancelar necesito identificarte. ¿Cuál es tu número de documento?" → "Para cancelar, ¿tu número de documento?"
- "¿Cuál es tu número de documento?" → "¿Tu número de documento?"
- "Para pagar tu cita necesito identificarte. ¿Cuál es tu número de documento?" → "Para pagar, ¿tu número de documento?"

**Otros:**
- "Cuéntame qué información necesitas y con gusto te ayudo." → "¿Qué información necesitas?"
- "¿Qué te gustaría hacer con tu cita?" → "¿Qué quieres hacer?"
- "Puedo ayudarte a agendar, reagendar, cancelar o confirmar tu cita. ¿Qué necesitas?" → "Puedo agendar, reagendar, cancelar o confirmar. ¿Qué necesitas?"
- "Perfecto, ¿para qué fecha quieres consultar?" → "¿Qué fecha?"
- "No encontré disponibilidad para el {x} ni en los próximos días. ¿Quieres elegir otra fecha?" → "Sin disponibilidad para el {x} ni días cercanos. ¿Eliges otra fecha?"
- "No hay disponibilidad para el {x}. La fecha más cercana disponible es el {y}. ¿Quieres tomar esa?" → "No hay cupo el {x}. Lo más cercano: {y}. ¿La tomamos?"
- "Claro, elige la fecha que prefieras:" → "Elige la fecha:"
- "Encontré tus citas activas:" → "Tus citas activas:"
- "¿Confirmas que quieres cancelar esta cita?" → "¿Confirmas la cancelación?"
- "✓ Tu asistencia quedó confirmada. Te esperamos el jueves 8 de mayo a las 9:15 AM." → "✓ Asistencia confirmada. Te esperamos el jueves 8 de mayo, 9:15 AM."
- "✓ Tu cita fue cancelada exitosamente. ¿Quieres agendar una nueva cita?" → "✓ Cita cancelada. ¿Agendamos una nueva?"

## Alcance

Solo `src/routes/index.tsx`. Sin cambios de lógica, estilos, mocks ni componentes.
