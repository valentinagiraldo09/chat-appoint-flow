## Recomendaciones siempre visibles + CTA fijo en `/confirmacion`

### 1. Sacar Recomendaciones del card de la cita
En `src/routes/confirmacion.tsx`, eliminar el botón colapsable "Recomendaciones" (líneas 280-289) que está dentro del card de la cita.

### 2. Nueva card de Recomendaciones (abajo, siempre abierta)
Debajo del card de la cita, agregar una card independiente con el mismo estilo cyan (`border-cyan-300 bg-cyan-50`, `rounded-2xl`, `p-5`). Contenido:
- Título "Recomendaciones" en bold (sin ícono Eye, ya que están desplegadas por defecto).
- Lista de bullets con recomendaciones genéricas para una cita médica:
  - Llegar 15 min antes.
  - Traer documento de identidad y carné de aseguradora.
  - Llevar exámenes, recetas o historia clínica reciente.
  - Reprogramar/cancelar con al menos 12 h de anticipación.

### 3. CTA "Pedir nueva cita" siempre visible
Convertir el bloque del botón "Pedir nueva cita" en una **barra fija inferior** (`fixed inset-x-0 bottom-0 z-40`) con:
- Fondo `bg-background/95` con `backdrop-blur` y borde superior.
- Botón centrado (full-width en mobile, auto en desktop).
- Agregar `h-24` (spacer) al final del contenedor scrollable para que el footer no tape el código.

El código de la cita queda dentro del flujo normal, justo arriba del spacer.

Si la importación de `Eye` queda sin usar, removerla del import de lucide-react.
