# Prototipo funcional — Agendamiento médico con asistente

Voy a construir un prototipo navegable end-to-end (P0 → P7) con datos mock dinámicos, estados simulados (loaders, validaciones, filtros) y un calendario inteligente conectado a la disponibilidad. Sin backend real; toda la lógica vive en el cliente.

## Arquitectura y estado

- Stack actual: TanStack Start + React + Tailwind + shadcn/ui (ya instalado).
- Una ruta por pantalla en `src/routes/`: `index.tsx` (P0), `disponibilidad.tsx` (P1), `horarios.tsx` (P2), `buscar-fecha.tsx` (P3), `checkout.tsx` (P4), `oportunidad.tsx` (P5), `pago.tsx` (P6), `confirmacion.tsx` (P7).
- **Estado global del flujo** con Zustand (`src/store/booking.ts`): especialidad, servicio, fecha, slot seleccionado, filtros activos, datos del paciente, aseguradora, resultado de cobertura, método de pago. Persistencia en `sessionStorage` para sobrevivir refresh.
- **Mocks dinámicos** (`src/mocks/`):
  - `catalog.ts`: especialidades, servicios jerárquicos (Cardiología → Primera vez/Control, etc.), sedes (4+), profesionales (6+), tipos de atención, franjas, aseguradoras.
  - `availability.ts`: generador determinístico (seed por fecha) que produce días disponibles del mes y, para cada día disponible, una lista variada de slots (hora, profesional, sede, tipo, precio). No se repite la misma data en días distintos.
  - `coverage.ts`: lógica que decide caso 1/2/3 según aseguradora + servicio (determinístico, no random puro, para que sea reproducible).

## P0 — Asistente inicial

- Hero centrado con input grande (placeholder "¿Qué quieres hacer hoy?") y debajo chips de intención (Agendar, Reagendar, Cancelar, Confirmar, Pagar, Consultar).
- Área tipo chat inline debajo: al elegir "Agendar una cita" o escribir texto que matchee keywords (`agendar`, `cita`, `doctor`, `reservar`, `turno`), aparece burbuja del asistente: "¿Qué especialidad necesitas?" + chips (Dermatología, Medicina General, Ginecología, Optometría, Pediatría, Cardiología).
- Otras intenciones muestran respuesta corta + CTA placeholder ("Próximamente" o navegación equivalente) — el flujo principal es Agendar.
- Al elegir especialidad → guarda en store y navega a P1.
- Detección de keywords con un matcher determinístico (sin IA).

## P1 — Disponibilidad

- Header con barra de búsqueda: dropdown jerárquico de servicio (especialidad → sub-servicio), date picker inteligente, botón Buscar. **Sin aseguradora.**
- Fila de filtros (chips/dropdowns con buscador interno usando `Command` de shadcn): Sede, Profesional, Tipo de atención, Franja. Filtros activos se muestran como chips removibles.
- Resultados en dos secciones: "Lo más pronto disponible — Hoy" (3 cards: mañana/mediodía/tarde) y "Mañana" (3 cards). Cada card: hora, profesional, sede, tag de tipo de atención, precio en COP. Botón "Ver más" → P2. Botón "Buscar otra fecha" → P3.
- Al cambiar cualquier filtro o fecha: loader skeleton ~600ms y se re-renderiza la lista filtrada desde el mock.

### Calendario inteligente (P1 y P3)

- Popover con calendario mensual custom basado en `react-day-picker` (ya viene con shadcn).
- Días con disponibilidad: borde/fondo verde suave, clickeables.
- Días sin disponibilidad: gris, `disabled`, no clickeables.
- Navegación entre meses respeta el mismo patrón.
- Al seleccionar día disponible: cierra popover, dispara loader, reemplaza slots con los del nuevo día.
- Link "Limpiar fecha" para volver a "lo más pronto".

## P2 — Ver más horarios

- Título con la fecha seleccionada, mismos filtros que P1 (compartidos vía store), grid completo de slots del día (12–20 cards generados por el mock).
- Click en slot → modal de confirmación. Botón Atrás → P1.

## P3 — Buscar otra fecha

- Layout 2 columnas (desktop): izquierda lista de slots del día seleccionado, derecha calendario inteligente grande (heatmap: intensidad según cantidad de slots disponibles ese día).
- Cambio de fecha → loader → nuevos slots a la izquierda, respetando filtros activos.
- Mobile: calendario arriba, slots abajo.

## Modal de confirmación

- Dialog centrado: fecha, hora, servicio, profesional, tipo atención, precio. Botones "Cerrar" y "Sí, avanzar" → guarda slot en store y navega a P4. Click fuera cierra.

## P4 — Checkout + validaciones

- Formulario (react-hook-form + zod): tipo documento (select), número, nombre, email, teléfono, dirección, checkbox tratamiento de datos (obligatorio), uploader opcional (máx 3 archivos / 15 MB, .jpg .png .pdf — validado en cliente, sin upload real).
- **Sección aseguradora**: dropdown con EPS A, EPS B, EPS C, Particular.
- Al hacer "Continuar": loader 1s simulando validación, luego se resuelve uno de 3 casos según mapping determinístico (aseguradora + servicio):
  - **Caso 1 — Cubre**: banner verde "Tu aseguradora cubre esta cita" → P5.
  - **Caso 2 — Cubre con disponibilidad posterior**: banner ámbar + dos botones "Tomar fecha sugerida (DD/MM)" o "Pagar particular" → ambos van a P5 con flag.
  - **Caso 3 — No cubre**: banner rojo + botón "Pagar particular" → P5.
- Si elige Particular en el dropdown, salta la validación y va directo a P5 como pago particular.

## P5 — Oportunidad de cita

- Pregunta "¿Encontraste la cita que querías?" con dos botones grandes Sí / No.
- Si **No**: aparece el calendario inteligente con campo "fecha preferida" (registra preferencia en el store, no cambia la cita real).
- Botón Continuar → P6.

## P6 — Pago

- Resumen completo de la cita (card con todos los datos del store).
- Si cobertura completa (Caso 1 sin override a particular): opciones "Confirmar sin pago" y "Pagar en clínica".
- Si particular: muestra valor + opciones "Pagar ahora" (loader 1.5s simulando pasarela) y "Pagar en clínica".
- Continuar → P7.

## P7 — Confirmación

- Check verde grande, "Tu cita quedó confirmada", resumen (fecha, hora, servicio, profesional, tipo atención, sede si aplica, código de cita generado).
- Acciones:
  - **Descargar PDF**: genera PDF en cliente con `jspdf`.
  - **Guardar en calendario**: descarga `.ics` generado en cliente.
  - **Agendar otra cita**: limpia el store y vuelve a P0.

## Detalles transversales

- Botón "Atrás" en cada pantalla (excepto P0 y P7) usando el router.
- Skeletons en lugar de spinners cuando se cargan listas; spinner pequeño en validaciones/pago.
- Responsive: en mobile las dos columnas de P3 colapsan, los filtros de P1 entran en un sheet, y el chat de P0 ocupa toda la pantalla.
- Persistencia del flujo entre rutas vía Zustand + sessionStorage para que refrescar no rompa el prototipo.
- Tipografía/espaciado neutros con tokens existentes (no se busca pixel-perfect con la referencia, pero los chips, cards y modales siguen el lenguaje visual de las imágenes: pill buttons, tags ámbar para tipo de atención, banner verde de "lo más pronto").

## Dependencias nuevas

- `zustand` (estado global)
- `react-hook-form` + `zod` + `@hookform/resolvers` (form P4)
- `jspdf` (PDF de confirmación)
- `date-fns` (manejo de fechas/heatmap)
- `lucide-react` ya disponible.

## Notas técnicas

- Toda la "API" vive en `src/mocks/api.ts` exponiendo funciones async (`searchSlots`, `getDayAvailability`, `validateCoverage`) que devuelven `Promise` con `setTimeout` para simular latencia, así el código de UI ya queda preparado por si después se conecta a backend real.
- Rutas tipadas TanStack; cada ruta con su `head()` propio.
