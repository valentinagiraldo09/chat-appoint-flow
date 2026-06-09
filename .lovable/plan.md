## Objetivo

Eliminar el botón "Atrás" (`<BackButton />`) del encabezado de la pantalla de disponibilidad (`/disponibilidad`).

## Cambio

En `src/routes/disponibilidad.tsx`:

1. **Eliminar la importación** de `BackButton` (línea 53).
2. **Eliminar el uso** del componente `<BackButton to="/" />` dentro del encabezado (línea 341).
3. **Simplificar el contenedor flex** que actualmente agrupa el botón y el título. Como solo quedará el `<h1>`, el `<div className="mb-5 flex items-center gap-4">` se puede ajustar para que el título mantenga su alineación sin necesidad del `flex` y `gap-4`.

El resultado es un encabezado limpio con solo el título "Selecciona una cita".