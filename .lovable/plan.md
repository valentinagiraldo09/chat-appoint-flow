## Objetivo

El banner "¿Quieres una cita antes?" debe mostrarse **únicamente** cuando se cumplan TODAS estas condiciones:

1. El usuario eligió una **fecha preferida** en el chat (`preferredDate` existe).
2. Esa fecha preferida **no tiene disponibilidad con la aseguradora** del usuario.
3. Esa fecha preferida **sí tiene disponibilidad particular**.

Si no hay fecha preferida, o la fecha preferida tiene cupo con la aseguradora, o no tiene cupo particular, el banner **no se muestra**.

## Estado actual

En `src/routes/disponibilidad.tsx` (líneas 374-403), la condición del banner es:

```
estado === "estado-2" && preferredDate && epsSection && parseYmd(preferredDate) < epsSection.date
```

Esto valida que la fecha preferida es anterior a la primera fecha disponible con aseguradora (condición 2), pero **no verifica que la fecha preferida realmente tenga cupo particular** (condición 3). Por eso el banner puede aparecer aunque ese día no exista cupo particular real.

## Cambio a implementar

Editar la condición del banner en `src/routes/disponibilidad.tsx` para agregar la verificación de cupo particular en la fecha preferida, usando `hasAvailability` del mock (`@/mocks/availability`).

Nueva condición:

```text
estado === "estado-2"
  && preferredDate                                      // existe fecha preferida
  && epsSection
  && parseYmd(preferredDate) < epsSection.date          // sin cupo aseguradora ese día
  && hasAvailability(parseYmd(preferredDate), specialty, service)  // sí hay cupo particular ese día
```

Detalles:
- Importar `hasAvailability` desde `@/mocks/availability` (actualmente solo se importan `filterSlots`, `generateSlots`, `parseYmd`, `ymd`, `findNextAvailableDate`).
- Mantener el resto del bloque del banner (estilos, texto y acción de navegar a Particular con `preferredDate`) sin cambios.

## Verificación

- Ginecología / Primera vez / EPS Sura, fecha preferida 9 de junio (sin cupo aseguradora, con cupo particular) → banner visible mostrando 9 de junio.
- Misma selección con fecha preferida que sí tenga cupo con aseguradora → banner oculto.
- Fecha preferida sin cupo particular real → banner oculto.
- Sin fecha preferida → banner oculto.
