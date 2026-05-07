## Modal de pago Izipay (mock visual)

Recrear el modal de la pasarela Izipay como un overlay UI dentro de la app (sin integración real). Se dispara desde dos lugares:

1. **`/pago`** — al hacer click en **Continuar** cuando la opción seleccionada es "Deseo pagar ahora y ahorrar tiempo".
2. **`/confirmacion`** — al hacer click en el CTA **Pagar ahora** (actualmente es un `Link` a `/pago`; se reemplaza por un botón que abre el modal directo).

### Componente nuevo: `src/components/IzipayModal.tsx`

Modal centrado con backdrop oscuro (`bg-black/60`), card blanca redondeada (`rounded-lg`), max-width ~400px, sombra. Replica fiel de la referencia:

- **Header**: ícono de canasta (lucide `ShoppingBasket`) a la izquierda en gris; a la derecha "Número de pedido" (texto pequeño gris) sobre número en negrita (generado: 10 dígitos aleatorios). Botón cerrar (X) circular gris arriba a la derecha.
- **Separador** fino.
- **Tabs de método de pago** (4 cards en grid): Tarjeta (seleccionada con borde teal `#14b8a6` y check verde), Plin - Interbank, QR, y un cuarto con flecha desplegable. Solo visual, "Tarjeta" siempre activa.
- **Subtítulo centrado**: "Recuerda activar tus compras por internet" (gris).
- **Campos de formulario** (solo UI, no funcional):
  - Número de tarjeta (input con íconos Visa/Mastercard/Diners/Amex a la derecha, usando texto/badges grises de placeholder)
  - Caducidad + CVV (grid 2 col)
  - Nombres + Apellidos (grid 2 col, prellenados con datos del paciente del store si existen)
  - Correo electrónico (prellenado con `patient.email`)
- **Botón pagar** ancho completo, color teal `#14b8a6`, texto blanco: `Pagar S/{precio}` usando `slot.price` formateado con `formatCOP` (cambiar a formato S/).
- **Footer**: "POWERED BY izipay" centrado, gris pequeño + logo de Coco pequeño junto al powered by (requisito del usuario).

Al hacer click en "Pagar S/X": muestra spinner ~1.2s, luego ejecuta callback `onSuccess` que setea `paymentMethod = "online"`, genera código de confirmación y navega a `/confirmacion`.

### Cambios en `src/routes/pago.tsx`

- Estado `showIzipay`. La función `confirm()` cuando `method === "online"` abre el modal en vez de navegar inmediatamente. Cuando `method === "clinic"` mantiene el flujo actual.
- Render `<IzipayModal open={showIzipay} onClose={() => setShowIzipay(false)} onSuccess={...} amount={slot.price} />`.

### Cambios en `src/routes/confirmacion.tsx`

- Reemplazar el `<Link to="/pago">Pagar ahora</Link>` (líneas 242-247) por un `<button>` que abre el modal Izipay directamente. Al éxito, actualiza `paymentMethod` a `"online"` y se queda en `/confirmacion` (la UI re-renderiza al estado pagado).

### Detalles visuales clave

- Color principal teal: `#14b8a6` (Tailwind `teal-500`).
- Sin uso de tokens de marca de la app — el modal imita Izipay, no la app.
- Símbolo de moneda `S/` (no COP) en el botón pagar, según referencia.
- Logo de Coco: pequeño (h-4) al lado de "POWERED BY izipay" en el footer.
