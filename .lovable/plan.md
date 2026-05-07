## Objetivo

Simplificar la pantalla P5 (Validación) a **solo 3 estados**:

1. `kind: "ok"` → confirmar y pagar
2. `kind: "limite_paciente"` → la aseguradora aún no cubre la fecha elegida
3. `kind: "sin_cobertura"` → la aseguradora no cubre el servicio (absorbe el caso que antes era `lista_negra`)

Los antiguos kinds `lista_negra`, `sin_alternativa` y `sin_disponibilidad` desaparecen de P5. La existencia o no de una cita particular alternativa **no genera un kind nuevo**: se calcula y, si existe, se sugiere; si no, simplemente no se muestra ese bloque.

---

## Cambios por archivo

### 1. `src/mocks/validations.ts`

- Reducir el union `ValidationResult` a:
  ```ts
  type ValidationResult =
    | { kind: "ok" }
    | { kind: "limite_paciente"; fechaPermitida: string }
    | { kind: "sin_cobertura" };
  ```
- Eliminar las variantes `lista_negra`, `sin_alternativa`, `sin_disponibilidad`.
- Eliminar el campo `telefonoEPS` (el teléfono de contacto pasa a ser un literal en la UI o un valor estático compartido, sin modelarse en el resultado).
- Reglas mock por sufijo de documento (se mantienen las palancas de QA, redirigidas al nuevo set):
  - termina en `11` → `limite_paciente`
  - termina en `22` o `00` → `sin_cobertura`
  - termina en `33` → también mapea a `sin_cobertura` (antes era `sin_alternativa`; el "no hay particular" deja de ser un kind y se resuelve naturalmente cuando `findParticularSlot` retorna `null`)
  - reglas previas que devolvían `sin_disponibilidad` (Pediatría + EPS Sura + Primera vez) → mapean a `sin_cobertura` también (es la opción más cercana semánticamente bajo el nuevo modelo)

### 2. `src/routes/validacion.tsx`

- Eliminar los 3 bloques JSX correspondientes a `lista_negra`, `sin_alternativa` y `sin_disponibilidad` (líneas 243-282, 334-362, 365-386).
- Limpiar imports no usados tras la poda (`ShieldOff`, `Clock4`, `XCircle`, `Phone`, `CreditCard` si ya no se usan).
- Mantener intactos los bloques `ok` y `limite_paciente`.
- Bloque `sin_cobertura`: ya existe y muestra la sugerencia particular condicionalmente (`particularSlot ? <SuggestedSlotCard/> : <fallback/>`). Confirmar que:
  - Si NO hay `particularSlot`, **no se muestra ningún bloque de sugerencia particular** (cambiar el fallback actual por `null` en lugar de la card "No encontramos un horario particular cercano").
  - Igual tratamiento en el bloque `limite_paciente`: si no hay particular, ocultar tanto el separador "o puedes tomar esta cita" como el bloque sugerido (no mostrar fallback).
- En `sin_cobertura`, el subtítulo conserva el teléfono como literal (`"Contáctate con tu aseguradora al 800 721 3344"`), absorbiendo el caso anterior de `lista_negra`.

### 3. `src/routes/checkout.tsx`

- No requiere cambios funcionales (sigue llamando `runValidations` y guardando el resultado), pero el typecheck obligará a remover cualquier narrowing sobre los kinds eliminados si existiera. Verificar tras editar.

### 4. `.lovable/plan.md` y `/mnt/documents/flujo-agendamiento-coco.md`

- Actualizar la sección de P5 para reflejar los 3 únicos kinds y la regla "particular es sugerencia opcional, no estado".

---

## Por qué

- **Modelo más simple**: el equipo manejaba 6 kinds que en realidad colapsaban a 3 decisiones de producto (sigue, espera fecha, no cubierto). Reducir a 3 elimina ramas muertas en UI.
- **Particular como sugerencia, no estado**: ya sea por límite de paciente o por sin cobertura, la oferta particular es **una mejora opcional**, no una bifurcación del flujo. Modelarla como kind aparte (`sin_alternativa`) duplicaba lógica.
- **`lista_negra` ⊂ `sin_cobertura`**: desde la perspectiva del paciente la experiencia es idéntica (no puedes agendar con tu EPS, contacta a tu aseguradora). El teléfono específico por EPS deja de viajar en el resultado y se trata como un dato estático de la pantalla.

---

## Verificación post-cambio

- Documento `...11` → ver pantalla `limite_paciente` (con o sin sugerencia particular según haya slot).
- Documento `...22` / `...00` / `...33` → ver pantalla `sin_cobertura` (con o sin sugerencia particular).
- Documento normal → ver pantalla `ok`.
- Confirmar que no quedan imports/iconos sin usar y que el typecheck pasa.
