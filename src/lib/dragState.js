// Marca de tiempo del último arrastre: el `click` que el navegador dispara al
// soltar no debe abrir el detalle de la tarjeta.
export const dragState = { endedAt: 0 };
export const justDragged = () => Date.now() - dragState.endedAt < 250;
