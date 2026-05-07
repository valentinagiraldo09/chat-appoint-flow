## Cambios en `src/components/IzipayModal.tsx`

1. **Header: reemplazar ícono de cesta por logo de Coco**
   - Quitar `ShoppingBasket` del import de `lucide-react`.
   - Sustituir `<ShoppingBasket className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />` por `<CocoLogo className="h-7 w-auto" />`.

2. **Footer: dejar solo "POWERED BY izipay"**
   - Eliminar el separador `·` y el `<CocoLogo />` del footer (líneas 187-188).
   - Mantener únicamente `POWERED BY` + `izipay` con el mismo estilo actual.

3. **Empty states (placeholders) iguales a la referencia de Izipay**
   - `Número de tarjeta` → `**** **** **** ****`
   - `Caducidad` → `MM / AA`
   - `CVV` → `***`
   - Inputs Nombres / Apellidos / Correo: añadir placeholders `Nombres`, `Apellidos`, `ejemplo@correo.com`.

No se tocan otros archivos.