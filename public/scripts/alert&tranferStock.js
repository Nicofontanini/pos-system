function transferStock(productId) {
    const quantity = document.getElementById(`quantity-${productId}`).value;
    const errorDiv = document.getElementById(`error-${productId}`);
    const quantityInput = document.getElementById(`quantity-${productId}`);

    fetch('/transfer-stock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId,
            quantity: parseInt(quantity),
            fromLocation: 'local2',
            toLocation: 'local1'
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Error en la transferencia');
            });
        }
        return response.json();
    })
    .then(data => {
        errorDiv.style.display = 'none';
        quantityInput.value = ""; // Reset input value
        // No actualizamos el stock aquí, esperamos la actualización por socket
    })
    .catch(error => {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    });
}

// Modificar el socket listener para manejar la actualización única
socket.on('stock-update', function (data) {
    console.log('Recibiendo actualización de stock:', data); // Debug log
    const stockElement = document.getElementById(`stock-${data.productId}`);
    if (stockElement) {
        stockElement.textContent = data.newStock;
        const quantityInput = document.getElementById(`quantity-${data.productId}`);
        if (quantityInput) {
            quantityInput.max = data.newStock;
        }
    }
});

socket.on('receive-alert-from-local1', function (alertMessage) {
    const alertDiv = document.getElementById('alert-message');

    // Verificar si alertMessage es un objeto
    if (typeof alertMessage === 'object' && alertMessage !== null) {
      const { productName, stockLevel, localFrom, timestamp } = alertMessage;
      const date = new Date(timestamp).toLocaleString();

      // Construir el mensaje
      const message = `¡Alerta de stock bajo! 
    Producto: ${productName}
    Stock Bajo,
    Local de origen: ${localFrom}
    Fecha: ${date}`;

      // Mostrar el mensaje en el alertDiv
      alertDiv.textContent = message;
    } else {
      // Si alertMessage no es un objeto, mostrarlo directamente
      alertDiv.textContent = alertMessage;
    }

    alertDiv.style.display = 'block';

    // Ocultar la alerta después de 60 segundos
    setTimeout(() => {
      alertDiv.style.display = 'none';
    }, 60000);
  });
