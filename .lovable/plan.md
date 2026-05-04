## Objetivo

Rediseñar la pantalla inicial (`/`) en dos estados claros, alineados a la marca **Coco**, e implementar el guion conversacional descrito (agendar, reagendar, cancelar, confirmar asistencia) con un parser inteligente que extrae aseguradora + servicio + fecha del primer mensaje libre y solo pregunta lo que falte.

---

## 1. Assets de marca

- Copiar `user-uploads://logo.svg` a `src/assets/coco-logo.svg`.
- Crear componente `<CocoLogo />` (en `src/components/CocoLogo.tsx`) que importa el SVG y lo renderiza con `className` configurable. Reemplaza el ícono `Stethoscope` en header del chat y como avatar del bot.

## 2. Catálogo

Agregar a `src/mocks/catalog.ts`:
- `EPS = ["Nueva EPS", "EPS Sanitas", "EPS Sura", "EPS Compensar", "Particular"]` (alias de `ASEGURADORAS` ampliado con "Nueva EPS").
- Helper `parseDateChip(label)` → devuelve `{ key, dateISO?, rangeLabel }` para chips: "Lo más pronto posible", "Esta semana", "La próxima semana", "En 15 días", "Elegir fecha".

## 3. Estado inicial — Estado 1 (hero)

Reescribir el render del hero en `src/routes/index.tsx`:

```text
┌─────────────────────────────────────┐
│              [logo Coco]            │
│                                     │
│   Gestiona tu cita fácil y rápido   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ ¿Cómo puedo ayudarte?    [→] │   │
│  └──────────────────────────────┘   │
│                                     │
│  [Agendar] [Reagendar] [Cancelar]   │
│  [Confirmar asistencia]             │
└─────────────────────────────────────┘
```

- Fondo blanco limpio, max-w centrado.
- Input grande con borde suave, botón enviar circular oscuro con ícono `Send` (avión de papel).
- Chips debajo (los 4 intents principales del guion).

## 4. Estado 2 — Vista chat

Layout full-height blanco con tres zonas:

**Header fijo**
- Logo Coco + texto "Asistente Coco"
- Botón derecho "Nueva conversación" → resetea bubbles + store + vuelve a Estado 1.

**Área mensajes (scrollable)**
- Bot izquierda con avatar Coco, burbuja gris clara.
- Usuario derecha, burbuja oscura (`bg-foreground text-background`).
- Soporta render de **chips de respuesta** anclados a la última burbuja del bot.
- Soporta render de **cards** (cita hardcodeada para reagendar/cancelar/confirmar).
- Soporta render de **input simulado** (documento) con su propio botón Continuar.

**Input fijo abajo**
- "Escribe tu consulta..." + botón enviar oscuro.

## 5. Máquina de estados de la conversación

Reemplazar el `step` actual por un estado tipado:

```ts
type FlowKind = "agendar" | "reagendar" | "cancelar" | "confirmar" | null;
type AgendarStep = "specialty" | "service" | "eps" | "date" | "ready";
type IdStep = "ask-doc" | "show-card" | "confirm-cancel" | "done";
```

Store local del componente:
```ts
{ flow, agendarStep, idStep, draft: { specialty?, service?, eps?, dateKey?, doc? } }
```

### 5.1 Flujo AGENDAR

Pre-condición: necesita **especialidad/servicio + EPS + fecha** antes de buscar.

Al entrar al flujo (chip "Agendar una cita" o detección por texto):
1. Pregunta lo que **falte** según `draft`. El orden es:
   - Especialidad (chips = `SPECIALTIES`)
   - Servicio / "primera vez vs control" (chips = `SERVICES[specialty]`)
   - EPS (chips = `EPS`)
   - Fecha (chips de los 5 presets)
2. Cuando los 4 datos estén listos, mostrar burbuja:
   *"Listo. Tengo todo lo que necesito. Voy a mostrarte la disponibilidad."*
   + chips resumen `✓` (no clicables) y navegar a `/disponibilidad` tras 600 ms.

### 5.2 Parser del primer mensaje libre

Función `parseMessage(text)` que devuelve `Partial<Draft> & { intent? }`:
- `intent`: detectar verbos (agendar/reagendar/cancelar/confirmar). Si no hay verbo pero hay especialidad → `agendar`.
- `specialty`: usar `detectSpecialty` ya existente, ampliado.
- `service`: regex "primera vez", "control", "seguimiento", "procedimiento", "citología".
- `eps`: buscar coincidencia con `EPS` (incluye "particular", "nueva eps", "sanitas", "sura", "compensar").
- `dateKey`: regex "lo más pronto", "esta semana", "próxima semana", "siguiente semana", "15 días", "quincena", "mañana", "hoy", o fecha `dd/mm`.

Después del parse, fusionar con `draft` y saltar al primer paso faltante. Ejemplos:
- *"Quiero una cita de dermatología"* → set specialty, preguntar servicio.
- *"Cita Sura, Cardiología primera vez para la próxima semana"* → set todo, ir directo al resumen + navegar.
- *"Cita la próxima semana"* → set fecha, preguntar especialidad.

### 5.3 Flujo REAGENDAR / CANCELAR / CONFIRMAR

Patrón común:
1. Bot: "Para X necesito identificarte. ¿Cuál es tu número de documento?"
2. Render de input simulado en chat con botón **Continuar**.
3. Al continuar → bot muestra burbuja "Encontré tus citas activas:" + **card hardcodeada**:
   ```
   Dermatología primera vez
   Jueves 8 de mayo · 9:15 AM
   Dra. María Rodríguez · Sede Centro
   [Acción primaria]
   ```
4. Acciones específicas:
   - **Reagendar** → click → `navigate("/disponibilidad")` (con `draft.specialty="Dermatología"`, service "Primera vez").
   - **Cancelar** → click → bot pregunta confirmación con botones `[Sí, cancelar] [No, volver]` → al confirmar muestra check + chips `[Agendar nueva cita] [No, gracias]`.
   - **Confirmar asistencia** → click → bot muestra "✓ Tu asistencia quedó confirmada. Te esperamos el jueves 8 de mayo a las 9:15 AM."

## 6. Integración con resto del flujo

- Cuando AGENDAR esté listo, antes de navegar:
  - `setSpecialty`, `setService`, `setAseguradora`.
  - Mapear `dateKey` → `setPreferredDate(ISO)` (helper en `parseDateChip`).
  - Transferir bubbles al chat persistente (como ya hace `transferChatAndGo`) para que el `ChatPanel` lateral en `/disponibilidad` continúe la conversación.
- `ChatPanel` lateral: extender el detector para reconocer cambios de aseguradora también, y añadir EPS al mensaje de bienvenida.

## 7. Detalles técnicos

Archivos a tocar:
- **crear** `src/components/CocoLogo.tsx`
- **copiar** `user-uploads://logo.svg` → `src/assets/coco-logo.svg`
- **reescribir** `src/routes/index.tsx` (hero + máquina de estados completa)
- **editar** `src/mocks/catalog.ts` (añadir `EPS`, `parseDateChip`)
- **editar mínimo** `src/components/ChatPanel.tsx` (avatar Coco + detección EPS)
- *(opcional)* extraer subcomponentes `ChatMessage`, `ChipsRow`, `AppointmentCard`, `DocInput` en `src/components/chat/` para mantener `index.tsx` legible.

No requiere cambios en `booking.ts` (los campos `aseguradora`, `preferredDate`, `service`, `specialty` ya existen).

## 8. QA manual al terminar

1. Click en chip "Agendar una cita" → recorre los 4 pasos con chips → resumen → navega a disponibilidad con datos prellenados.
2. Escribir *"Quiero cita Sura dermatología primera vez próxima semana"* → salta directo al resumen y navega.
3. Escribir *"Quiero cita la próxima semana"* → pregunta especialidad → servicio → EPS → resumen.
4. Chip "Reagendar mi cita" → pide doc → muestra card → al hacer clic navega a disponibilidad.
5. Chip "Cancelar mi cita" → doc → card → confirmación → mensaje final con chips.
6. Chip "Confirmar asistencia" → doc → card → mensaje final.
7. "Nueva conversación" limpia bubbles, draft y vuelve al hero.
