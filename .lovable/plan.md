## Rediseño UX/UI de la pantalla `/validacion` (P5)

### Objetivo
Hoy cada caso (ok / límite / lista negra / sin cobertura / sin disponibilidad) usa un banner de color saturado + cards genéricas. Funciona pero se siente como un "error de formulario". Vamos a pasarlo a un layout tipo **resultado de gestión** consistente con el resto del flujo (mismo lenguaje visual de `/checkout` y `ConfirmModal`), donde:

- El estado se comunica con un ícono en círculo + título + subtítulo claro, sin grandes fondos rojos/amarillos.
- La cita que el paciente intentó tomar **siempre es visible arriba** como "tarjeta resumen" (anclaje emocional: no perder el contexto de lo que estaba agendando).
- Las acciones se jerarquizan: **una sola CTA primaria recomendada** + acciones secundarias claramente menores.
- Cada caso explica con lenguaje humano qué pasó y cuál es el siguiente paso, no etiquetas internas.

### Layout común (nuevo)

```text
┌──────────────────────────────────────────┐
│  ← Volver                                │
├──────────────────────────────────────────┤
│  [icono] Estado en una línea             │  ← header sobrio
│  Subtítulo explicativo (1-2 líneas)      │
├──────────────────────────────────────────┤
│  Resumen de la cita que intentabas       │  ← SIEMPRE visible
│  Especialidad · Servicio                 │     (compacto, gris suave)
│  Fecha · Hora · Profesional · Sede       │
├──────────────────────────────────────────┤
│  [ CTA primaria recomendada ]            │  ← una sola, full-width
│                                          │
│  Otras opciones                          │  ← secundarias en lista
│  → Opción B                              │
│  → Opción C                              │
└──────────────────────────────────────────┘
```

Componentes nuevos en `src/components/validacion/`:
- `ResultHeader.tsx` — ícono en círculo (tono suave, no fondo saturado), título, subtítulo. Variantes: success, warning, info, blocked.
- `IntentSummary.tsx` — resumen de la cita intentada (specialty/service/slot) con estilo "card silencioso".
- `ActionList.tsx` — primaria + lista de secundarias con flecha derecha.
- `SuggestedSlotCard.tsx` — variante cuando hay un slot particular sugerido (reutilizable para Límite y Sin cobertura).

### Por caso

**OK — `tu cita aplica`**
- Header: check verde suave, "Todo listo para confirmar tu cita".
- Subtítulo: "Verificamos tu cobertura con {aseguradora}."
- IntentSummary visible.
- CTA primaria: "Confirmar cita" → `/pago`.
- Sin secundarias.

**Límite de paciente**
- Header: warning ámbar suave, "Tu aseguradora aún no permite agendar este servicio".
- Subtítulo: "Podrás hacerlo desde el {fechaPermitida}. Mientras tanto tienes estas opciones:"
- IntentSummary.
- CTA primaria recomendada: card "Agendar el {fechaPermitida} con mi aseguradora" → `/disponibilidad` (con minDate).
- Secundarias:
  - "Tomar como particular ahora — {hora} con {prof} · {precio}" (si hay particularSlot).
  - "Ver más horarios particulares" → `/disponibilidad`.

**Lista negra (sin cobertura institucional)**
- Header: info azul/neutro, "Esta cita no se puede agendar con tu aseguradora".
- Subtítulo: "Comunícate con {aseguradora} al {tel} para más información." (sin la palabra "lista negra"; teléfono como link `tel:` con ícono).
- IntentSummary.
- CTA primaria: "Tomar esta cita como particular · {precio}" → `/pago` con override.
- Secundarias:
  - "Ver más horarios particulares".
  - "Llamar a mi aseguradora" (link tel).

**Sin cobertura del servicio**
- Header: info, "Tu aseguradora no cubre este servicio".
- Subtítulo: "Puedes tomarlo como particular o ver qué servicios sí están cubiertos."
- IntentSummary.
- CTA primaria: SuggestedSlotCard particular → `/pago` con override.
- Secundarias:
  - "Ver disponibilidad cubierta por mi aseguradora".
  - "Inscribirme en lista de espera".

**Sin disponibilidad**
- Header: neutro, "No encontramos disponibilidad en este momento".
- Subtítulo: "Te avisamos apenas se libere un horario para {especialidad} con {aseguradora}."
- IntentSummary (la que intentaba) — para confirmar qué buscaba.
- CTA primaria: "Inscribirme en lista de espera" → abre `WaitlistDialog`.
- Sin secundarias.

### Sistema visual (consistente con el resto de la app)

- **Sin fondos saturados** (`bg-red-50`, `bg-amber-50`, `bg-emerald-50`) — pasamos a íconos en círculo `bg-{tono}-100 text-{tono}-700` sobre fondo `bg-card`.
- Bordes `border-border`, radios `rounded-2xl`, sombras suaves `shadow-sm` (mismo lenguaje que `/checkout`).
- Tipografía: título `text-2xl font-semibold`, subtítulo `text-muted-foreground`. Quitar los `text-{color}-900`.
- Botón primario: `rounded-full bg-foreground text-background` (ya en uso).
- Acciones secundarias como filas con `<ChevronRight />` a la derecha, hover `bg-accent/40`, no como cards grandes — reduce ruido y deja una sola card primaria destacada.
- Móvil: stack vertical natural; en desktop, todo en columna única max-w-xl centrada (más enfocado que el grid 2-col actual).

### Archivos a tocar

- **Editar** `src/routes/validacion.tsx` — reemplazar las 5 sub-vistas por composición de los nuevos primitives.
- **Crear** `src/components/validacion/ResultHeader.tsx`.
- **Crear** `src/components/validacion/IntentSummary.tsx`.
- **Crear** `src/components/validacion/ActionList.tsx` (`PrimaryAction`, `SecondaryAction`).
- **Crear** `src/components/validacion/SuggestedSlotCard.tsx`.

Sin cambios en `src/mocks/validations.ts`, `src/store/booking.ts` ni `src/routes/checkout.tsx` — la lógica se mantiene, solo cambia la presentación.

### Cómo probarlo (igual que antes)
Documento termina en: `00` lista negra · `11` límite · `22` sin cobertura · `33` sin disponibilidad · cualquier otro `ok`.