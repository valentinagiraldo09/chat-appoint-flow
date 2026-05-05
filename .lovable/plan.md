## Cambio en `src/routes/disponibilidad.tsx` (estado-2)

Reemplazar el bloque actual de la card particular (líneas 336–350) por un **banner CTA** compacto, sin mostrar slots.

### Nuevo bloque

```tsx
{estado === "estado-2" && particularSection && particularSection.slots.length > 0 && (
  <button
    onClick={() => navigate({
      to: "/disponibilidad",
      search: { specialty, service, aseguradora: "Particular" },
    })}
    className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#FFA800] bg-[#FFF6E5] px-5 py-4 text-left transition hover:bg-[#FFEFCC]"
  >
    <div className="flex items-center gap-3">
      <Zap className="h-5 w-5 shrink-0 text-[#B36B00]" />
      <div>
        <div className="font-bold text-base">¿Quieres una cita antes?</div>
        <div className="text-sm text-foreground/80">
          Disponibilidad particular desde el {format(particularSection.date, "d 'de' MMMM", { locale: es })}
        </div>
      </div>
    </div>
    <span className="text-sm font-medium text-[#B36B00] whitespace-nowrap">
      Ver citas particulares →
    </span>
  </button>
)}
```

### Notas

- El banner es un único CTA clickeable; no renderiza `SectionCard` ni slots.
- Usa los mismos colores ámbar (`#FFF6E5` / `#FFA800` / `#B36B00`) y el ícono `Zap` ya importado.
- Al hacer click, navega a `/disponibilidad` con `aseguradora: "Particular"`, lo que dispara `estado-3` y muestra la disponibilidad particular completa.
- `particularSection.date` ya está calculado (primer día con slots particulares), así que la fecha del banner es real.
- Sin cambios en `SectionCard`, mocks, ni en otros estados.
