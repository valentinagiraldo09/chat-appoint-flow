## Problema

Dos problemas combinados en los selectores de chips (especialidad, servicio/subservicio, EPS):

1. **Listas muy largas** que inundan el chat.
2. **Etiquetas muy largas** (ej. "Crecimiento y desarrollo - control pediátrico", "Nueva EPS contributivo régimen subsidiado") que rompen la fila, generan chips de ancho irregular y saltos de renglón impredecibles.

## Propuesta unificada

Un solo patrón "Top + Buscar" con reglas claras de longitud + ancho de chip, aplicado igual a los 3 selectores.

### Regla por cantidad de opciones (igual para los 3 selectores)

- **≤ 6** → chips en `flex-wrap` (render actual).
- **7–12** → fila horizontal scrollable de una sola línea + chip "Ver todas".
- **> 12** → top 5 sugeridas + "Ver todas (N)".

### Regla por longitud del texto del chip

Para que la grilla se vea ordenada y los chips no rompan la fila de forma rara:

- **Truncado con tooltip**: cada chip tiene `max-w-[18ch]` (≈18 caracteres visibles) + `truncate` + `title={label}`. Si el texto excede, se muestran "…" y al hover aparece el texto completo. En mobile, long-press / tap muestra el tooltip.
- **Ancho mínimo uniforme**: `min-w-[7rem]` para que chips muy cortos (ej. "Control") no queden enanos junto a otros largos.
- **Padding consistente**: `px-3.5 py-1.5`, sin cambios.
- **Salto de línea controlado**: `whitespace-nowrap` dentro del chip (nunca rompe el texto en dos líneas) + `flex-wrap` en el contenedor (los chips saltan al siguiente renglón completos, no parten palabras).
- **Máximo de chips por fila visible (modo wrap)**: cuando hay ≤6 opciones pero alguna es larga, el `flex-wrap` con `max-w-[18ch]` garantiza ~3 chips largos por fila a 1280px y ~2 en mobile, sin desbordes.

### Cuando un texto es "demasiado largo" (>22 caracteres)

Activar automáticamente el modo "fila scrollable + Ver todas" aunque haya pocas opciones. Razón: con 4 chips de 35 caracteres cada uno, el wrap se ve peor que un scroll horizontal limpio + el modal para revisar todo con calma.

### Selector completo (`OptionsPicker`)

Reutilizable, basado en `shadcn/ui` `Command` dentro de `Dialog` (desktop) / `Drawer` (mobile, vía `useIsMobile`):

- `CommandInput` con autofocus, filtro tolerante a tildes/typos usando `norm()`.
- `CommandList` con grupos cuando aplique ("Recientes", "Más usadas", "Todas A–Z").
- En el listado del modal **no hay truncado**: el espacio vertical lo permite, el usuario ve el texto completo.
- Selección → cierra el picker y dispara el mismo callback que los chips. El flujo de chat no cambia.
- Teclado: ↑/↓ / Enter / Esc.

### Texto libre intacto

El parser (`detectSpecialty`, `detectService`, `detectEPS`) sigue funcionando con tolerancia a typos. El picker es complementario.

## Cambios técnicos

1. Nuevo `src/components/OptionsPicker.tsx` (Dialog + Command, responsive a Drawer).
2. Nuevo `src/components/ChipList.tsx` que encapsula la regla de cantidad + longitud y renderiza chips + "Ver todas". Recibe: `options`, `title`, `onPick`, opcional `recent`, `top`.
3. `ChipsRow` en `src/routes/index.tsx` se simplifica usando `ChipList` para los 3 casos (`specialty`, `service`, `eps`).
4. Tokens de chip largo (`max-w-[18ch]`, `min-w-[7rem]`, `truncate`, `whitespace-nowrap`) centralizados en `ChipList`.
5. Constante opcional `TOP_EPS` en `src/mocks/catalog.ts`.
6. Sin cambios en el store ni en la máquina de estados.

## Resultado

- Chips siempre alineados, nunca dos líneas dentro del mismo chip.
- Listas largas se resuelven con scroll horizontal o modal con buscador.
- Etiquetas largas se truncan con tooltip y se ven completas en el modal.
- Mismo patrón para los 3 selectores → consistencia visual y de interacción.
