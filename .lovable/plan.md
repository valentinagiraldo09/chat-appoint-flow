## Objetivo

En el banner "Ver disponibilidad con mi aseguradora" (el que permite volver a ver horarios cubiertos por la EPS) mostrar también la fecha desde la cual la aseguradora puede dar la cita.

## Contexto

- El banner está en `src/routes/disponibilidad.tsx`, líneas 366-398.
- Ya existe en el store el valor `coverageMinDate` (línea 193), que es justamente la fecha desde la cual la aseguradora ofrece disponibilidad. Hoy solo se usa para navegar (línea 370), no se muestra.

## Cambio

En el subtítulo del banner, agregar la fecha formateada cuando `coverageMinDate` exista:

```text
Volver a ver horarios cubiertos por EPS Sura.
Disponibilidad desde el 6 de julio.
```

Detalle técnico:
- Parsear `coverageMinDate` (string `yyyy-MM-dd`) con el helper `parseYmd` ya presente en el archivo y formatear con `format(..., "d 'de' MMMM", { locale: es })`, igual que se hace en el banner verde (línea 418).
- Mostrar la segunda línea solo si `coverageMinDate` está definida; si no, dejar el subtítulo actual sin cambios.

No se modifica lógica de negocio ni navegación, solo el texto presentado en el banner.