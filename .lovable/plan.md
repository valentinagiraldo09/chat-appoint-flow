## Objetivo

En la pantalla inicial mostrar solo 3 chips de acción: **Agendar una cita**, **Gestionar mis citas** y **Consultar información**. Cuando el usuario elija "Gestionar mis citas", el bot preguntará en el chat qué quiere hacer (reagendar, cancelar, confirmar o pagar) y luego derivará al flujo correspondiente que ya existe.

## Cambios en `src/routes/index.tsx`

### 1. Tipos

- Añadir `"gestionar"` al union `FlowKind`.
- Añadir un nuevo kind de burbuja `{ kind: "manage-options" }` para renderizar los 4 chips (Reagendar, Cancelar, Confirmar, Pagar) dentro del chat.

### 2. Hero (líneas ~567-586)

Reemplazar la lista de 6 chips por exactamente 3:

```
{ label: "Agendar una cita",       icon: "🗓", intent: "agendar"   },
{ label: "Gestionar mis citas",    icon: "🗂", intent: "gestionar" },
{ label: "Consultar información",  icon: "ℹ",  intent: "consultar" },
```

Mantener mismo estilo visual de pill/chip; al ser 3 quedan más respirados, sin cambios de layout.

### 3. Flujo "gestionar" en `startFlow`

Añadir rama `intent === "gestionar"`:

- `botSay("¿Qué te gustaría hacer con tu cita?")`
- Luego `addBubble({ kind: "manage-options" })`.

### 4. Nuevo renderer en `BubbleRenderer`

Para `kind === "manage-options"` renderizar 4 chips horizontales (mismo estilo `chip` de `ChipsRow`) con:

- 🔄 Reagendar mi cita
- ✕ Cancelar mi cita
- 🕐 Confirmar asistencia
- 💳 Pagar mi cita

Cada chip llama una nueva función `pickManageIntent(sub)` que:

1. `userSay(label)` con el texto del chip.
2. Llama `startFlow(sub, { skipUserBubble: true })` con `sub` ∈ `"reagendar" | "cancelar" | "confirmar" | "pagar"`, lo que reusa los flujos existentes (pedir documento → mostrar tarjeta → acciones).

### 5. Detección por texto libre

En `detectIntent` añadir antes del fallback `"agendar"`:

```
[["gestionar", "gestionar mis citas", "mis citas", "administrar cita"], "gestionar"]
```

Así si el usuario escribe "quiero gestionar mi cita" en el input también arranca el sub-menú.

### 6. Propagación a `BubbleRenderer` y `ChatBubbles`

Pasar el nuevo handler `onPickManageIntent` por props desde `P0` hasta `BubbleRenderer`, igual que se hace hoy con `onCardAction` y `onConfirmCancel`.

## Resultado

- La home queda con 3 chips claros y agrupados por propósito.
- "Gestionar mis citas" no toca aún ningún flujo: primero pregunta en el chat con 4 chips, y al elegir uno entra al flujo existente sin duplicar lógica (reusa `startFlow` para reagendar/cancelar/confirmar/pagar).
- "Consultar información" se mantiene como hoy.
- No se requieren cambios en otras rutas ni en el store.
