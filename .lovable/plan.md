## Cambios a aplicar

### 1. Eliminar `/oportunidad` del flujo y del proyecto
- Borrar `src/routes/oportunidad.tsx`.
- No tocar `src/routeTree.gen.ts` (TanStack lo regenera automáticamente al detectar la eliminación).
- Verificar que ningún componente/ruta enlace a `/oportunidad` (búsqueda confirma que solo el archivo y el route tree generado lo referencian).

### 2. Limpiar referencias a `/oportunidad` en `/mnt/documents/flujo-agendamiento-coco.md`
- Tabla §2 (mapa de pantallas): borrar fila **P5b**.
- §3.7 P5b — Oportunidad: eliminar la sección completa (renumerar siguientes a P5b = cobertura legacy si quiero, o simplemente quitar el bloque P5b).
- §5 Empty states: quitar la fila “Sin oportunidad más temprana (P5b)”.
- Apéndice A (estructura de archivos): quitar `oportunidad.tsx`.

### 3. Sincronizar el .md con el modelo de validación de 3 estados
La iteración previa simplificó `ValidationResult` a `ok | limite_paciente | sin_cobertura`, pero el documento todavía describe `lista_negra`, `sin_alternativa`, `sin_disponibilidad` y `telefonoEPS`. Reescribir:

- **§3.6 tabla de kinds** → dejar solo 3 filas: `ok`, `limite_paciente`, `sin_cobertura`. En `limite_paciente` y `sin_cobertura` aclarar: “si existe `particularSlot` se muestra como sugerencia opcional; si no, no se muestra ningún bloque alternativo” (no es un kind aparte).
- **§6.2 Caso 2** → renombrar a “No cubierto (`sin_cobertura`)”. Quitar `sin_alternativa` y `lista_negra`. Explicar que el caso de “lista negra” queda absorbido por `sin_cobertura` (mismo estado desde el punto de vista del paciente). El slot particular es opcional, no estado.
- **§6.3 limite_paciente** → mantener; aclarar que `particularSlot` se muestra solo si existe.
- **§6.1 Caso 1** → ya correcto, mínima limpieza para reflejar las 3 reglas reales en `validations.ts`.
- **§11.4 Validaciones** → sustituir el listado de sufijos por:
  - `…11` → `limite_paciente`
  - `…22`, `…00`, `…33` → `sin_cobertura`
  - Particular o `bypassCoverage` → `ok`
  - Pediatría + Sura + Primera vez → `sin_cobertura` (antes decía `sin_disponibilidad`)
  - Cardiología + Primera vez → `sin_cobertura`
  - Default → `ok`
- **§11.6 “Reglas que cambian determinísticamente”**: actualizar “Mostrar sin disponibilidad” → ahora se reproduce desde el estado-4 de `disponibilidadStates.ts`, no desde validación.
- Donde aparezca `telefonoEPS` (header de `lista_negra`): quitar.

### 4. Añadir nueva sección “Flujos posibles explicados para no técnicos”
Insertarla justo antes de “Apéndice A”. Estructura:

- Introducción de 3 líneas: “Esta sección describe en lenguaje sencillo los caminos que puede recorrer un paciente. No requiere conocimiento técnico.”
- **Flujo A — Todo sale bien (cubierto por aseguradora)**: el paciente conversa con Coco, ve horarios, elige uno, llena sus datos, su EPS cubre la cita y va directo a la confirmación sin pagar. Indicar pasos numerados con ejemplo de paciente.
- **Flujo B — Todo sale bien pero paga particular**: igual al A pero el paciente eligió Particular (o cambió a Particular en algún punto). Termina pasando por la pantalla de pago con el modal de tarjeta.
- **Flujo C — La aseguradora aún no lo cubre en esa fecha (`limite_paciente`)**: explicar que la aseguradora pone una fecha mínima (ej. en 30 días). El paciente puede esperar y ver disponibilidad desde esa fecha, o tomar una cita particular sugerida. Si no hay particular cercano, simplemente se ofrece esperar o entrar a lista de espera.
- **Flujo D — La aseguradora no cubre el servicio (`sin_cobertura`)**: explicar que esa combinación de servicio + EPS no aplica. El paciente puede pagar particular si hay un horario sugerido, o anotarse en lista de espera, o buscar otra cita.
- **Flujo E — No hay horarios disponibles**: antes de elegir slot, en `/disponibilidad` aparece el modal “No hay disponibilidad”. El paciente puede dejar sus datos en lista de espera o cambiar de servicio.
- **Flujo F — El paciente cambia de aseguradora a mitad de camino**: explicar el banner verde que permite volver atrás sin perder datos.
- **Flujo G — Reagendar / cancelar / consultar**: el asistente Coco maneja estas intenciones desde la pantalla inicial sin pasar por el resto del flujo.

Cada flujo en bullets cortos: “Qué ve el paciente”, “Qué decisiones puede tomar”, “Cómo termina”. Sin jerga técnica (sin mencionar `kind`, `Zustand`, `Slot`, etc.).

### 5. Salida
- El archivo se reescribe en su lugar: `/mnt/documents/flujo-agendamiento-coco.md`.
- Se emite un `<lov-artifact>` para que el usuario pueda descargar la nueva versión.

## Notas técnicas

- No hay imports rotos al borrar `oportunidad.tsx` (búsqueda solo encuentra referencias internas + el route tree autogenerado).
- `src/routeTree.gen.ts` se regenera; no se edita a mano.
- El .md se actualiza con `code--write` (reescritura completa porque hay muchos puntos dispersos).