
    // Funciones para el historial
    function showHistory() {
        const modal = document.getElementById('historyModal');
        modal.style.display = 'block';
        loadHistory();
      }
  
      function closeHistoryModal() {
        document.getElementById('historyModal').style.display = 'none';
      }
  
      function loadHistory() {
        const local = window.location.pathname.includes('local1') ? 'local1' : 'local2'; // Determinar el local actual
        const date = document.getElementById('filterDate').value; // Obtener la fecha del filtro (si existe)
        socket.emit('get-order-history', { local, date }); // Enviar el local y la fecha al servidor
      }
      function filterHistoryByDateRange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
  
        if (!startDate || !endDate) {
          alert('Por favor selecciona fechas de inicio y fin');
          return;
        }
  
        socket.emit('get-order-history-range', {
          local: currentLocal,
          startDate: startDate,
          endDate: endDate
        });
      }
  
      function filterHistory() {
        const dateInput = document.getElementById('filterDate');
        const date = dateInput.value;
  
        if (!date) {
          console.error('No se ha seleccionado fecha');
          return;
        }
  
        socket.emit('get-order-history', { local: currentLocal, date: date });
      }
  
      socket.on('order-history', function (history) {
        const container = document.getElementById('historyContainer');
        container.innerHTML = '';
  
        history.forEach(order => {
          const orderElement = document.createElement('div');
          orderElement.className = 'order-card';
          orderElement.innerHTML = `
        <p>Fecha: ${new Date(order.date).toLocaleString()}</p>
        <p>Nombre del pedido: ${order.orderName}</p> <!-- Nombre del pedido -->
        <p>Vendedor: ${order.sellerName}</p> <!-- Mostrar el nombre del vendedor -->
        <p>Total: $${order.total}</p>
        <p>Método de pago: ${order.paymentMethod}</p>
        <button onclick='printSingleOrder(${JSON.stringify(order)})'>Imprimir</button>
      `;
          container.appendChild(orderElement);
        });
      });
  
      function printHistory() {
        const historyContent = document.getElementById('historyContainer').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
       <link rel="stylesheet" href="/styles/base.css">
      </head>
      <body>
        <h2>Historial de Pedidos</h2>
        ${historyContent}
      </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
      }
  
      function printSingleOrder(order) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(generateOrderPrintContent(order));
        printWindow.document.close();
        printWindow.print();
      }