## Cambio

En `src/mocks/validations.ts`, hoy:
- Documento que termina en `00` → `lista_negra`
- Documento que termina en `22` → `sin_cobertura`

Se va a unificar para que ambos devuelvan el mismo resultado que hoy muestra `22`: `sin_cobertura`.

## Implementación

En `src/mocks/validations.ts`:

1. Eliminar la rama de `doc.endsWith("00")` que devuelve `lista_negra`.
2. Cambiar la condición de `sin_cobertura` para cubrir ambos sufijos:
   ```ts
   if (doc.endsWith("22") || doc.endsWith("00")) {
     return { kind: "sin_cobertura" };
   }
   ```

No se toca ninguna otra regla (11, 33, cobertura por especialidad, particular, bypass).

## Notas

- La pantalla `cobertura.no-cubre.tsx` ya maneja el caso `sin_cobertura`, así que documentos terminados en `00` ahora caerán ahí en lugar de la pantalla de lista negra.
- No se elimina el tipo `lista_negra` del union para no romper otros lugares que ya lo manejan; simplemente deja de dispararse desde el mock.