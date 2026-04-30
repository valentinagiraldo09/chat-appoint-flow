
# Plan: implementar los 5 casos del asistente según el intent elegido en P0

Quiero adaptar el asistente actual (`src/routes/index.tsx` + flujo P1→P5) para que el **intent seleccionado en P0** o detectado en el primer mensaje libre dispare uno de estos 5 sub-flujos, replicando la lógica de los flujos de WhatsApp que enviaste. Todo se mantiene como prototipo funcional con datos mock y persistencia en `sessionStorage` (ya existe en `useBooking`).

## 1. Nueva capa de mocks

**`src/mocks/patients.ts`** (nuevo)
- `MOCK_PATIENTS`: lista de pacientes con `documento`, `nombre`, `email`, `celular`, `telAlterno`. Al menos 2 documentos pre-cargados (ej. `1001370488` → "Valentina COCO" con cita activa, `1001370490` → paciente sin citas) y un caso “no existe” para el flujo nuevo.
- `findPatient(doc)`, `createPatient(data)`.

**`src/mocks/appointments.ts`** (nuevo)
- `MOCK_APPOINTMENTS`: array mutable en memoria con citas existentes asignadas a un documento (servicio, fecha futura, sede, profesional, modalidad, estado: `pendiente_pago | confirmada | cancelada`, precio, requiere cobro sí/no).
- Helpers: `getAppointmentsByDoc`, `cancelAppointment`, `confirmAppointment`, `rescheduleAppointment(id, newSlot)`, `markPaid`.
- Generación determinística para que cada documento siempre vea las mismas citas en la sesión.

**`src/mocks/coverage.ts`** (ya existe) — añadir flag `requiresAgent` para EPS específicas (ej. "EPS Sura" cuando paciente es nuevo) → dispara el flujo "transferir a agente".

## 2. Cambios en el store (`src/store/booking.ts`)

Añadir:
- `intent?: "agendar" | "reagendar" | "cancelar" | "confirmar" | "pagar" | "consultar"`
- `documento?: string`
- `acceptedTerms: boolean`
- `currentAppointmentId?: string` (para reagendar/cancelar/confirmar)
- `flowResult?: "no_availability" | "transferred_to_agent" | "cancelled" | "confirmed" | "paid"` para mostrar pantalla final apropiada.
- Setters correspondientes.

## 3. Refactor de P0 (`src/routes/index.tsx`)

El asistente sigue siendo conversacional, pero después del intent inicial entra en una **máquina de estados** dentro del chat (no se navega aún) que pide:

```text
[gate] Términos y condiciones (chips Sí/No)
   → [doc] Pedir número de documento
        → si existe paciente: saludo + pedir intent (si no vino claro)
        → si NO existe: pedir nombre, email, confirmar celular, tel alterno
                          → registrar en mocks → continuar como agendar
```

Una vez identificado el paciente y el intent, navega al sub-flujo correspondiente. La barra de chat fija (ya existente) gestiona toda esta conversación.

## 4. Sub-flujos por intent

### A. Agendar — sin disponibilidad
- Tras elegir especialidad + servicio + aseguradora, si `findNextAvailableDate(...)` devuelve `null` para esa combinación específica (forzaremos esto cuando especialidad = "Dermatología" + servicio = "Procedimiento" como en el ejemplo, vía un override en mocks):
  - Mensaje del bot: “Lo siento, por ahora no tengo citas disponibles para este sub-servicio…”
  - Pantalla nueva `src/routes/sin-disponibilidad.tsx` con CTA “Notificarme cuando abra” (mock toast) y “Volver al inicio”.

### B. Agendar — con disponibilidad y cobro (flujo principal ya existente)
- Reutiliza `/disponibilidad` → `/horarios` → `/checkout` → **nuevo paso** “Confirmar datos de contacto” (chips Sí/No) → `/pago` → `/confirmacion`.
- Añadir en `/checkout` la pantalla intermedia que muestra los datos del paciente actuales y permite confirmar/editar (replicando el “¿Tus datos siguen siendo los mismos?”).
- Si la cita tiene `precio > 0` y aseguradora = Particular o `coverage.requiresPay`, mostrar paso de cobro con opciones “Pagar ahora / Pagar después”. Si “Pagar después” → ir directo a confirmación con estado `pendiente_pago`.

### C. Confirmar asistencia (con cobro)
- Nueva ruta `src/routes/mis-citas.tsx` que lista las citas mock del documento, mostrando estado.
- Selección → detalle → si requiere pago: ir a `/pago` con flag `purpose=confirm`. Tras pagar: `markPaid` + pantalla “Cita pagada y confirmada”.
- Si no requiere pago: confirmación directa.

### D. Reagendar (gestionar cita)
- Misma `mis-citas.tsx` pero con acciones: **Reagendar** | **Cancelar**.
- Reagendar → `/disponibilidad` precargado con la especialidad y sede de la cita original → al elegir slot → mismo paso de cobro/confirmación → `rescheduleAppointment` actualiza el mock → pantalla resumen final con todos los detalles (replicando el bloque “esta es la información de su cita” con recomendaciones).

### E. Cancelar
- Desde `mis-citas.tsx` → confirmar acción en modal (`ConfirmModal` ya existe) → `cancelAppointment` → toast “La cita se canceló con éxito” + estado actualizado en lista.

### F. Paciente nuevo + remitir a agente
- Si en el flujo de creación de paciente, al pedir aseguradora el usuario elige una marcada como `requiresAgent` (mock: "EPS Sura" para pacientes nuevos):
  - Bot dice “Te estoy conectando con uno de nuestros agentes…”
  - Pantalla nueva `src/routes/agente.tsx` con loader animado y simulación “Agente conectado en ~30s” (estático, sin polling real).

## 5. Sincronización con el ChatPanel lateral

`ChatPanel` ya escucha cambios de filtros. Le añado:
- Reconocimiento de comandos del nuevo dominio: “cancela mi cita”, “quiero reagendar”, “confirma mi asistencia” → cambian `intent` y navegan a `/mis-citas`.
- Mensajes `system` cuando se complete una acción (cancelación, pago, reagendamiento) para que el usuario vea el eco bidireccional en el chat.

## 6. Nuevas rutas a crear

```text
src/routes/sin-disponibilidad.tsx   → flujo A
src/routes/mis-citas.tsx            → flujos C, D, E (lista + detalle inline)
src/routes/agente.tsx               → flujo F
```

Las rutas existentes `/disponibilidad`, `/horarios`, `/checkout`, `/pago`, `/confirmacion` se reutilizan, ajustando `/checkout` para incluir el paso de confirmación de datos de contacto y respetar `intent` (reagendar vs agendar nuevo).

## 7. Detalles técnicos

- **Persistencia**: todo el estado nuevo va en `useBooking` (sessionStorage); las mutaciones de citas viven en módulo `appointments.ts` con `let` array (se resetea al recargar — aceptable para prototipo).
- **Detección NLP en P0**: ampliar `detectIntent` para “confirmar mi cita”, “cancelar”, “reagendar” (ya existe parcial). El intent detectado salta el menú de chips si el documento ya está dado.
- **Términos y condiciones**: gate único por sesión (`acceptedTerms` en store). Si ya aceptó, no se vuelve a pedir.
- **Mensajería**: replicar tono y emojis de los flujos WA (mensajes del bot literalmente parecidos a los pegados, en español, con saltos de línea).
- **Datos contacto editable**: dentro de `/checkout`, modal con form (nombre, email, celular, tel alterno) → al guardar actualiza el paciente mock.

## 8. Orden de implementación

1. Mocks: `patients.ts`, `appointments.ts`, ampliar `coverage.ts`.
2. Store: añadir `intent`, `documento`, `acceptedTerms`, `currentAppointmentId`, `flowResult`.
3. Refactor P0: máquina de estados gate → doc → (registro si nuevo) → enrutar por intent.
4. Crear `sin-disponibilidad.tsx`, `mis-citas.tsx`, `agente.tsx`.
5. Ajustar `/checkout` (paso confirmación contacto + soporte `intent=reagendar`) y `/pago` (soporte `purpose=confirm`).
6. Ampliar `ChatPanel` con comandos de gestión.
7. QA manual de los 5 flujos en preview.

¿Apruebas este plan para que lo implemente?
