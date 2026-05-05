## Rediseño del caso "Sin cobertura" en `/validacion`

Aplicamos los cambios solo al bloque `result.kind === "sin_cobertura"` de `src/routes/validacion.tsx`. Tono, header y demás casos se mantienen.

### Cambios visuales (referencia mockup)

```
        [ icono info ]
   Tu aseguradora no cubre este servicio

   ┌─────────────────────────────────────┐
   │  Cardiología · Primera vez          │  ← resumen compacto (sin "Cita que intentabas agendar")
   │  Mié 12 may · 10:30 · Dr. Pérez     │
   └─────────────────────────────────────┘

   Tenemos estas opciones para ti

   ┌─────────────────────────────────────┐
   │  Cita particular sugerida           │
   │  Mié 12 may · 10:30                 │
   │  Dr. Pérez · Sede Norte             │
   │  Particular        $ 180.000        │
   │  [   Agendar esta cita   ]          │
   └─────────────────────────────────────┘

   ┌─────────────────────────────────────┐
   │  Lista de espera                    │
   │  Te avisamos cuando se libere…      │
   │  [   Inscribirme   ]                │
   └─────────────────────────────────────┘
```

### Componentes

1. **`IntentSummary` (`src/components/validacion/IntentSummary.tsx`)** — añadir prop opcional `compact?: boolean`.
   - Cuando `compact`: oculta el eyebrow "Cita que intentabas agendar", reduce padding (`p-4`), título en `text-sm font-semibold`, y consolida fecha/hora/profesional en un único renglón `text-xs text-muted-foreground` separado por `·` (sin grid de 2 columnas, sin iconos).
   - Comportamiento por defecto sin cambios → no afecta a los otros casos.

2. **`SuggestedSlotCard`** — sin cambios estructurales. En esta pantalla se usa con:
   - `eyebrow="Cita particular sugerida"`
   - `ctaLabel="Agendar esta cita"` (en lugar de incluir el precio en el botón; el precio ya está visible en la card).

3. **Nuevo bloque "Lista de espera"** dentro del mismo branch — una card con el mismo estilo (`rounded-2xl border bg-card p-5`) que contiene título, descripción corta y un CTA primario `Inscribirme` que abre `WaitlistDialog`. Se implementa inline en el route (no requiere componente nuevo).

### Cambios en `src/routes/validacion.tsx`

Reemplazar el branch `sin_cobertura` (líneas ~224-258):

- Mantener `ResultHeader` con `icon={Info}`, `tone="info"`, `title="Tu aseguradora no cubre este servicio"`, `subtitle` corto: `"Te mostramos alternativas para que puedas atenderte."`
- `IntentSummary` con `compact`.
- Pequeño separador con texto: `"Tenemos estas opciones para ti"` (`text-sm font-medium text-muted-foreground px-1`).
- `SuggestedSlotCard` con `ctaLabel="Agendar esta cita"`. Si no hay slot particular, mostrar un mensaje neutro como hoy.
- Card "Lista de espera" inline con CTA `Inscribirme` → `setWaitlistOpen(true)`.
- Eliminar el `SecondaryActions` actual (ya no va "Ver disponibilidad cubierta" ni el row de lista de espera; queda solo la card dedicada).

Limpiar imports que dejen de usarse en este branch (`CalendarSearch`, `ListChecks` siguen usándose en otros branches → mantenerlos).

### Archivos modificados

- `src/components/validacion/IntentSummary.tsx` — añadir variante `compact`.
- `src/routes/validacion.tsx` — rediseñar branch `sin_cobertura`.

Sin cambios en lógica, mocks ni store.