## Cambio

En `src/routes/confirmacion.tsx` (líneas 235-246), dentro del bloque `isPendingClinic` (cuando el usuario eligió pagar haciendo fila), envolver el badge "Pago pendiente" y un nuevo CTA en un contenedor flex:

```tsx
<div className="flex flex-wrap items-center gap-2">
  <div className="inline-flex items-center gap-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">
    <AlertCircle className="h-4 w-4" />
    Pago pendiente: {formatCOP(slot.price)}
  </div>
  <Link
    to="/pago"
    className="inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-sm font-semibold text-background hover:opacity-90"
  >
    Pagar ahora
  </Link>
</div>
```

- Importar `Link` desde `@tanstack/react-router` si aún no está importado en el archivo.
- El bloque amarillo informativo y el resto del contenido se mantienen igual.
- El CTA solo aparece en el caso `isPendingClinic` (pago en clínica), no en `isPaid` ni `isCovered`.
