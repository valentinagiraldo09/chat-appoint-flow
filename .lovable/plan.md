## Cambios en `src/routes/disponibilidad.tsx`

### 1. Extender `SectionCard` con props `tone` e `icon`

Añadir a la firma:
- `tone?: "emerald" | "amber"` (default `"emerald"`)
- `icon?: ReactNode`

Header:
- `emerald`: `bg-emerald-100/70` (actual)
- `amber`: `bg-[#FFF6E5]`, body `border-[#FFA800]`

Estructura del header (sin `·`):
```
{icon} {label en font-bold} {fecha capitalizada en font-semibold}
```

### 2. Cambiar copy estado-2

Línea 309: `"Próxima disponibilidad con tu aseguradora"` → `"Disponibilidad con tu aseguradora"`.

### 3. Reemplazar bloque particular (líneas 336–365)

Sustituir por:

```tsx
<div>
  <h3 className="mb-3 text-lg font-semibold">¿Quieres una cita antes?</h3>
  <SectionCard
    tone="amber"
    icon={<Zap className="h-5 w-5 text-[#B36B00]" />}
    label="Disponibilidad particular"
    date={particularSection.date}
    slots={particularSection.slots}
    full={particularSection.full}
    showPriceInLink
    onSelect={setModalSlot}
  />
</div>
```

El link inferior queda en `"Ver más horarios →"` provisto por `SectionCard`.

Sin cambios en otros estados, mocks ni rutas.