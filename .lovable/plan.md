## Objetivo

Mejorar el copy del banner "¿Quieres una cita antes?" en `src/routes/disponibilidad.tsx` para que sea **más corto, directo y claro** sobre:
1. Es la **fecha preferida** del usuario.
2. Es **particular con pago** (no EPS).

## Cambio de copy

En el `<button>` del banner (líneas 418-430), sustituir el texto actual por:

- **Título:** `Hay cita particular el {fecha}` (ej. "Hay cita particular el 12 de junio")
- **Subtítulo:** `Tu fecha preferida · pago directo`
- **CTA:** `Ver horarios →`

Mantiene las mismas variables (`earlierParticularDate`, `format`, `es`) y no toca la lógica de navegación. Solo se cambian los nodos de texto.
