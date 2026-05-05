# Unificar layout de "límite de paciente" (doc 11) con el de "sin cobertura" (doc 22)

## Objetivo
La rama `limite_paciente` en `src/routes/validacion.tsx` usará la misma estructura visual que `sin_cobertura`, con el mensaje y CTAs adaptados a la fecha permitida por la aseguradora.

## Cambios en `src/routes/validacion.tsx`

Reemplazar el bloque actual de `result.kind === "limite_paciente"` por una estructura paralela a `sin_cobertura`:

1. **ResultHeader** — mantener icono `AlertTriangle` / tono `warning`, con el título y subtítulo actuales (mensaje de fecha permitida).
2. **IntentSummary** — pasar `compact` (versión deshabilitada/atenuada, igual que en 22), mostrando la cita que se intentaba agendar.
3. **CTA primario** — un `PrimaryAction` con label "Ver disponibilidad el {fecha} con mi aseguradora" que llama `verConAseguradora(result.fechaPermitida)`.
4. **Cita particular sugerida** — usar `SuggestedSlotCard` (mismo componente que 22) con eyebrow "Cita particular sugerida", CTA "Agendar esta cita" → `tomarSugeridoParticular(particularSlot)`, y secundario "Ver más disponibilidad" → `verMasParticulares`. Si no hay `particularSlot`, mostrar el mismo fallback que 22.
5. **Otras opciones** — un bloque `SecondaryActions` con un único row "Inscribirme en lista de espera" → abre `WaitlistDialog`.
6. **Buscar nueva cita** — botón de texto centrado debajo, igual que en 22, llamando `buscarNuevaCita`.

Se eliminan los `SecondaryActionRow` actuales de "Tomar como particular ahora" y "Ver más horarios particulares" porque su función queda cubierta por `SuggestedSlotCard`.

No se tocan otras ramas (ok, lista_negra, sin_cobertura, sin_disponibilidad) ni `validations.ts`.
