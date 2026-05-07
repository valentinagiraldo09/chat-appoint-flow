## Cambio solicitado

Reemplazar las 3 reglas actuales (`wrap` / `scroll` / `top`) por **una sola regla unificada** para los 3 selectores (especialidad, servicio, EPS):

- Mostrar **siempre máximo 4 chips visibles + 1 chip "Ver todas (N)"** = 5 chips totales.
- Si hay ≤ 5 opciones en total, se muestran todas y no aparece "Ver todas".
- Los chips se renderizan en `flex-wrap` (no scroll horizontal).
- Cada chip muestra el **texto completo**, sin truncar, sin tooltip.
- El texto puede ocupar **2 líneas** dentro del chip si es necesario (sin partir palabras).
- "Ver todas (N)" abre el `OptionsPicker` (Dialog/Drawer) ya existente con buscador.

## Cambios técnicos en `src/components/OptionsPicker.tsx` → `ChipList`

1. Eliminar el cálculo de `mode` (`wrap`/`scroll`/`top`) y la variable `hasLong`.
2. Calcular `visible`:
   - Si `count <= 5` → `visible = options` y no se muestra "Ver todas".
   - Si `count > 5` → `visible = top 4` (merge `recent + top + resto`, dedupe, slice 4) y se muestra "Ver todas (N)".
3. Reemplazar `chipBase` para permitir doble línea y texto completo:
   - Quitar: `whitespace-nowrap`, `truncate`, `max-w-[18ch]`, `min-w-[7rem]`.
   - Agregar: `whitespace-normal break-words text-left leading-snug max-w-[16rem]` (límite de ancho razonable que fuerza el salto a 2ª línea en textos largos sin partir palabras).
   - Mantener `rounded-2xl` (en vez de `rounded-full`) para que el chip se vea bien con 2 líneas — los chips multilínea con `rounded-full` quedan deformes.
4. Quitar `title={s}` (ya no se trunca).
5. Render único: siempre `<div className="flex flex-wrap gap-2 pl-10 items-start">{chips}{seeAll?}</div>`. Eliminar la rama de scroll horizontal y el gradiente lateral.
6. El chip "Ver todas (N)" mantiene `whitespace-nowrap` y `rounded-full` para diferenciarlo visualmente.

## Comportamiento resultante

- 14 especialidades → 4 chips + "Ver todas (14)".
- 10 EPS → 4 chips + "Ver todas (10)".
- 5 o menos servicios → todos visibles, sin "Ver todas".
- "Crioterapia para lesiones benignas" se ve completo, ocupando 2 líneas dentro del chip, alineado con los demás por `items-start`.

## Fuera de alcance

- `OptionsPicker` (modal/drawer) no cambia.
- `ChipsRow` en `src/routes/index.tsx` no cambia (sigue llamando a `ChipList`).
- Mocks de `catalog.ts` no cambian.
