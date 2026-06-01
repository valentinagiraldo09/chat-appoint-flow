## Objetivo

Dejar listos dos casos de prueba (uno en junio, otro en julio) que reproduzcan el escenario que probaste el 7 de mayo, **manteniendo el mismo servicio, subservicio y aseguradora** y cambiando únicamente la fecha:

- Especialidad: **Ginecología**
- Servicio (subservicio): **Primera vez**
- Aseguradora: **EPS Sura** (estado-2)

Flujo esperado en ambos casos:
1. En el chat pides Ginecología · Primera vez · EPS Sura para una **fecha específica**.
2. Esa fecha **no tiene cupo** → el bot avisa y propone la **siguiente fecha más cercana** con disponibilidad.
3. En Disponibilidad (P1) se muestra la fecha EPS + el banner de **cita Particular en la fecha que tú querías**.
4. En la **validación** también se sugiere la cita particular **en la fecha preferida**.

## Confirmaciones de lógica ya existente

- **La cita particular recomendada siempre cae en la fecha preferida.** Verificado en `src/routes/validacion.tsx`: `particularSlot` usa `preferredDate ?? date` y `findParticularSlot` fuerza `date: ymd(start)` (la fecha preferida) aunque el horario provenga de la siguiente fecha hábil. Esto ya está implementado, no requiere cambios.
- `hasAvailability`, `findNextAvailableDate` y el anclaje del particular a `preferredDate` son deterministas por fecha; el escenario ya funciona en junio y julio con la misma combinación cambiando solo la fecha.

## Casos de prueba (solo cambia la fecha)

Combinación fija para los dos: **Ginecología · Primera vez · EPS Sura**.

**Caso JUNIO**
- En el chat: "Quiero ginecología primera vez con EPS Sura para el **9 de junio**".
- El bot responde que no hay cupo el 9 de junio y propone lo más cercano: **11 de junio**.
- Aceptas → P1 muestra fecha EPS (11 jun) + banner de particular el **9 de junio**.

**Caso JULIO**
- En el chat: "Quiero ginecología primera vez con EPS Sura para el **2 de julio**".
- El bot responde que no hay cupo el 2 de julio y propone lo más cercano: **6 de julio**.
- Aceptas → P1 muestra fecha EPS (6 jul) + banner de particular el **2 de julio**.

Para ver además la sugerencia particular en la **validación**, usa un documento que termine en **22/00/33** (sin cobertura) o en **11** (límite de paciente). En ambos casos la cita particular sugerida aparecerá en la fecha preferida (9 jun / 2 jul).

(Fechas alternativas verificadas, misma combinación: junio 2/3/4→5, 10→11, 12→14; julio 3/4/5→6, 11→12, 16→17.)

## Trabajo a realizar

1. **Verificar end-to-end** ambos casos en el preview (chat → recomendación → P1 con banner particular → validación con sugerencia particular en la fecha preferida) y ajustar solo si algún paso no coincide.
2. **Limpiar texto de fecha fija de mayo**: en `src/routes/index.tsx` hay textos de confirmación quemados ("jueves 8 de mayo, 9:15 AM"). Actualizarlos para que no muestren una fecha de mayo ya pasada.

## Notas técnicas

- No se requiere cambiar la lógica del mock ni la del particular en validación; ambas son deterministas y ya anclan a la fecha preferida.
- Si prefieres que estas fechas-demo queden "fijas" y garantizadas, puedo añadir una pequeña lista en el mock, pero no es necesario para probar ahora.
