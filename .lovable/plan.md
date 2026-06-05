## Objetivo

Cuando el usuario hace clic en el chip "Elegir fecha", en lugar de mostrar un campo `<input type="date">`, desplegar directamente un calendario inline (como el de la imagen de referencia) con todos los días desde hoy en adelante habilitados, sin marcar disponibilidad específica.

## Cambios

### `src/routes/index.tsx`

Reemplazar el componente `DateInput` (líneas 926-948) por un calendario inline propio que:

- Muestre el encabezado con el mes/año (ej. "Junio 2026") y flechas para navegar entre meses (`ChevronLeft` / `ChevronRight`, ya disponibles vía lucide-react).
- Muestre la fila de días de la semana: L M M J V S D.
- Renderice una grilla de días del mes con la lógica de offset por lunes como primer día (igual que `SmartCalendar`).
- Habilite únicamente los días **desde hoy en adelante**; los días pasados se muestran deshabilitados/atenuados. No se pinta disponibilidad real.
- Impida navegar a meses completamente anteriores al mes actual (la flecha "anterior" se desactiva cuando corresponde).
- Al hacer clic en un día habilitado, llame `onSubmit(iso)` con la fecha en formato `yyyy-MM-dd` (usando el helper `ymd` de `@/mocks/availability`), conservando el flujo actual (`onPickSpecificDate`).
- Respete el estado `disabled` (cuando la burbuja no es la última) atenuando el calendario y evitando selección.

El estilo seguirá los tokens del design system (bordes redondeados, `bg-popover`/`bg-card`, acento verde para días seleccionables como en la referencia). Se mantiene el `pl-10` para alinear con las demás burbujas.

### Detalles técnicos

- Reutilizar el patrón de grilla de `src/components/SmartCalendar.tsx` (cálculo de `startWeekday`, `daysInMonth`, navegación de mes), pero sin la dependencia de `getMonthAvailability`: el criterio de habilitado pasa a ser simplemente `date >= today`.
- Importar `ChevronLeft`, `ChevronRight` (ya hay imports de lucide en el archivo; agregar los que falten), `format`/`es` de date-fns para el título del mes, y `ymd` de `@/mocks/availability`.
- No se cambia la firma `onSubmit(iso: string)` ni el tipo de burbuja `date-input`, por lo que el resto del flujo (validación de disponibilidad posterior en `pickSpecificDate`) permanece intacto.

No se requieren cambios de backend ni de lógica de negocio.
