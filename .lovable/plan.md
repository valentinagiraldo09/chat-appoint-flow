## Cambio

Reemplazar la lista `TIPOS_DOCUMENTO` en `src/mocks/catalog.ts` para que el selector de "Tipo de documento" en `/checkout` muestre únicamente:

- DNI
- Carné de extranjería
- Pasaporte

## Archivo afectado

- `src/mocks/catalog.ts` (línea 111): cambiar el array a `["DNI", "Carné de extranjería", "Pasaporte"]`.

No se requieren más cambios: `/checkout` ya consume `TIPOS_DOCUMENTO` desde ese mock, y la validación del formulario solo exige que el campo no esté vacío, así que los nuevos valores funcionan sin tocar el schema ni el store.
