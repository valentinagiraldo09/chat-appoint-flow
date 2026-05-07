## Cambios

### 1. "seguro" → "aseguradora"
- `src/routes/validacion.tsx` (líneas 289, 290, 341, 342): cambiar título a `"Aún no estás cubierto por tu aseguradora"` y subtítulo a `"Contáctate con tu aseguradora al 800 721 3344"` (manteniendo el sufijo en línea 342).
- `src/routes/cobertura.no-cubre.tsx` (líneas 54, 59): mismos reemplazos en el `<h1>` y el `<p>`.

### 2. Validación con doc terminado en 22 (`sin_cobertura`, validacion.tsx ~líneas 294-298)
Reemplazar el bloque divisor por un texto centrado en minúscula sin "O":

```tsx
<p className="text-center text-sm font-medium text-muted-foreground py-2">
  puedes tomar esta cita
</p>
```

### 3. Validación con doc terminado en 11 (`limite_paciente`, validacion.tsx ~línea 202)
Cambiar `"O puedes tomar esta cita"` → `"o puedes tomar esta cita"` (minúscula), manteniendo los divisores laterales.
