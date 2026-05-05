## Cambios en `src/routes/disponibilidad.tsx` (estado-2)

Replicar el layout de la imagen de referencia: los slots de la aseguradora ya no van dentro de una card verde con header, sino que se muestran como un grid plano de slot cards directamente bajo los filtros. El banner ámbar "¿Quieres una cita antes?" se mueve a justo debajo de los filtros (antes del grid de slots).

### Layout resultante (estado-2)

```text
[Header buscador]
[FiltersBar]
[Banner ámbar "¿Quieres una cita antes?"]   ← movido aquí
[Grid de slot cards (full, no SectionCard)]   ← sin header verde
[Ver más horarios →]   (alineado a la derecha si hay más)
```

### Cambios concretos

1. **Mover el banner ámbar** (líneas 336–360 actuales) a justo después de `<FiltersBar>` (línea 286), envuelto en la misma condición `estado === "estado-2" && particularSection && particularSection.slots.length > 0`. Añadir `mt-4` para separarlo de los filtros.

2. **Reemplazar el `SectionCard` para estado-2** (líneas 305–323): cuando `estado === "estado-2"`, en lugar de `SectionCard` renderizar un bloque plano:
   - Grid `grid gap-3 md:grid-cols-3` con `epsSection.full.map(slot => <SlotCard hidePrice ... />)` (mostrar todos, no sólo los 3 spread).
   - Si la lista está vacía, mostrar el mensaje "No hay horarios con esos filtros para este día." centrado.
   - Sin header verde, sin fecha visible (la fecha ya está implícita en el filtro de fecha del buscador superior).

3. **Mantener `SectionCard` con header verde** para los demás estados (`estado-1`, `estado-3`, y `nextSection`) — sin cambios.

4. El banner amarillo conserva el mismo estilo (border `#FFA800`, bg `#FFF6E5`, ícono `Zap`, CTA "Ver citas particulares →") y sigue navegando a `aseguradora: "Particular"`.

### Notas

- No se tocan mocks ni `SectionCard` (sigue usándose para estado-1 y estado-3).
- El banner se renderiza dentro del bloque `!loading` para que no aparezca durante el skeleton.
- Para estado-2 se muestran todos los slots filtrados (no sólo 3), ya que es la vista principal y no hay link "Ver más".