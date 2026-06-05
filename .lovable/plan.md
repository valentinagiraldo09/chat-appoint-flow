## Objetivo
Reorganizar la información dentro de cada card de disponibilidad (`src/components/SlotCard.tsx`).

## Cambios
1. **Reordenar** los datos para que el orden sea: **Aseguradora → Profesional → Sede**.
2. **Aseguradora y Profesional en doble columna**: mostrar ambos lado a lado en una fila de 2 columnas (grid de 2), cada uno con su etiqueta arriba y el valor abajo. La Sede queda debajo, a todo el ancho.

## Detalle visual
```text
┌──────────────────────────────┐
│ 8:00 AM            Presencial │
├──────────────────────────────┤
│ Aseguradora     Profesional   │
│ EPS Sura        Laura Castillo │
│                               │
│ Sede                          │
│ Sede Chapinero                │
│ Calle 60 #9-15                │
└──────────────────────────────┘
```

- La fila Aseguradora/Profesional usará `grid grid-cols-2 gap-3`.
- Si no hay aseguradora (no aplica), el Profesional ocupa su columna normalmente.
- La Sede se mantiene oculta para Telemedicina/Telefónica (como hoy).
- El precio permanece al pie sin cambios.

Solo cambios de presentación en `SlotCard.tsx`; sin tocar lógica de negocio.