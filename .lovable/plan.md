## Objetivo

Hacer que la transición del botón "Ver cita particular" a la card de cita sugerida se sienta natural y se entienda claramente que se está mostrando la cita particular sugerida.

## Problema actual

Al hacer clic en el botón, este desaparece y la card aparece de golpe (sin animación), en el mismo espacio. El cambio abrupto hace que no se perciba la relación entre la acción y el resultado.

## Cambios en `src/routes/validacion.tsx`

1. **Animación de entrada de la card**: aplicar `animate-fade-in` (fade + ligero desplazamiento hacia arriba) o `animate-enter` a un contenedor que envuelva el `SuggestedSlotCard`, para que aparezca de forma suave al desplegarse.

2. **Mini encabezado de contexto**: cuando la card está abierta, mostrar un pequeño texto introductorio encima de ella, por ejemplo "Esta es la cita particular más próxima disponible", para reforzar que es la sugerencia particular y darle continuidad al copy del botón.

3. **Ajuste de copy del botón**: cambiar el texto para que invite a la acción y conecte mejor con lo que se despliega, por ejemplo "Mostrar cita particular más próxima · $180.000" en lugar de "Ver cita particular".

4. **Posibilidad de cerrar/contraer**: mantener coherencia permitiendo volver a ocultar la card (opcional, según preferencia), de modo que la interacción de expandir/contraer sea clara.

## Detalles técnicos

- Envolver el render condicional de `SuggestedSlotCard` en un `<div className="animate-fade-in">` (utilidad ya disponible en el proyecto).
- El `eyebrow` del `SuggestedSlotCard` ya dice "Cita particular sugerida"; se complementa con el mini encabezado para reforzar la transición sin duplicar mensaje.
- No se modifica lógica de negocio ni el flujo de navegación, solo presentación y copy.
