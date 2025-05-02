socket.on('stock-update', function ({ local, items }) {
    // Verifica si el local es el correcto según la URL de la página
    const currentLocal = window.location.pathname.includes('local1') ? 'local1' : 'local2';

    if (local === currentLocal) {
      // Recorre los items actualizados
      items.forEach(item => {
        const stockElement = document.getElementById(`stock-${item.id}`);
        const productElement = document.getElementById(`product-${item.id}`);

        if (stockElement && productElement) {
          // Determina el nivel de stock actual
          const currentStock = item.product && item.product.stock !== undefined
            ? item.product.stock
            : (item.newStock !== undefined ? item.newStock : null);

          // Actualiza el stock en la interfaz
          stockElement.textContent = currentStock !== null
            ? currentStock
            : "Stock actualizado";

          // Verifica si el stock es bajo (menor o igual a 5)
          const isLowStock = currentStock !== null && currentStock <= 5;

          // Busca si ya existe la advertencia o el botón
          const existingWarning = productElement.querySelector('.low-stock');
          const existingButton = productElement.querySelector('button[onclick*="sendAlert"]');

          if (isLowStock) {
            // Si el stock es bajo, agrega una advertencia si no existe
            if (!existingWarning) {
              const warning = document.createElement('p');
              warning.className = 'low-stock';
              warning.textContent = `¡Stock bajo! (${currentStock} unidades)`;
              warning.style.color = 'red';
              warning.style.fontWeight = 'bold';
              productElement.appendChild(warning);
            } else {
              // Actualiza el texto de advertencia existente
              existingWarning.textContent = `¡Stock bajo! (${currentStock} unidades)`;
            }

            // Si el botón de alerta no existe, lo agregamos
            if (!existingButton && currentLocal === 'local1') {
              const productName = productElement.querySelector('h3').textContent;
              const alertButton = document.createElement('button');
              alertButton.textContent = 'Enviar alerta a Local 2';
              alertButton.className = 'alert-button';
              alertButton.onclick = function () {
                sendAlert(productName, currentStock);
              };
              productElement.appendChild(alertButton);
            }
          } else {
            // Si el stock no es bajo, eliminamos la advertencia y el botón si existen
            if (existingWarning) existingWarning.remove();
            if (existingButton) existingButton.remove();
          }
        }
      });
    }
  });

  // Función mejorada para enviar alerta
  function sendAlert(productName, stockLevel) {
    // Agregamos logs para debug
    console.log('Enviando alerta:', { productName, stockLevel });
    
    const alertData = {
        productName: productName,
        stockLevel: stockLevel,
        localFrom: 'Local 1',  // Fijamos el valor para asegurar el origen correcto
        timestamp: new Date().toISOString()
    };

    socket.emit('send-alert-to-local2', alertData);
    showNotification('Enviando alerta por email...', 'info');
}

// Agregamos listener para el estado de la alerta
socket.on('alert-email-status', function(response) {
    if (response.success) {
        showNotification('Alerta enviada correctamente', 'success');
    } else {
        showNotification('Error al enviar la alerta: ' + response.message, 'error');
    }
});

  // Función auxiliar para mostrar notificaciones
  function showNotification(message, type = 'info', duration = 5000) {
    // Verificar si ya existe el contenedor de notificaciones
    let notifContainer = document.getElementById('notification-container');

    if (!notifContainer) {
      notifContainer = document.createElement('div');
      notifContainer.id = 'notification-container';
      notifContainer.style.position = 'fixed';
      notifContainer.style.top = '10px';
      notifContainer.style.right = '10px';
      notifContainer.style.zIndex = '9999';
      document.body.appendChild(notifContainer);
    }

    // Crear la notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
  <div style="padding: 15px; margin-bottom: 10px; border-radius: 4px; background-color: ${type === 'success' ? '#d4edda' :
        type === 'error' ? '#f8d7da' :
          type === 'warning' ? '#fff3cd' : '#cce5ff'
      }; color: ${type === 'success' ? '#155724' :
        type === 'error' ? '#721c24' :
          type === 'warning' ? '#856404' : '#004085'
      }; border: 1px solid ${type === 'success' ? '#c3e6cb' :
        type === 'error' ? '#f5c6cb' :
          type === 'warning' ? '#ffeeba' : '#b8daff'
      };">
    ${message}
    <span style="float: right; cursor: pointer; font-weight: bold;" onclick="this.parentElement.parentElement.remove();">&times;</span>
  </div>
`;

    notifContainer.appendChild(notification);

    // Eliminar después del tiempo especificado
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }
