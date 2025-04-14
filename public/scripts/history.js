async function filterHistory() {
  try {
    const filterDate = document.getElementById('filterDate').value;
    const response = await fetch(`/api/orders/${currentLocal}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const orders = await response.json();
    console.log('Fetched orders:', orders); // Debug log

    const historyContainer = document.getElementById('historyContainer');
    historyContainer.innerHTML = ''; // Clear existing content

    orders.forEach(order => {
      const orderDate = new Date(order.date).toLocaleDateString();
      if (!filterDate || orderDate === new Date(filterDate).toLocaleDateString()) {
        const orderElement = document.createElement('div');
        orderElement.className = 'history-item';
        orderElement.innerHTML = `
          <h3>Orden #${order.orderId}</h3>
          <p>Fecha: ${orderDate}</p>
          <p>Cliente: ${order.orderName}</p>
          <p>Vendedor: ${order.sellerName}</p>
          <p>Total: $${order.total}</p>
          <p>Método de pago: ${order.paymentMethod}</p>
          <details>
            <summary>Ver items</summary>
            <ul>
              ${order.items.map(item => `
                <li>${item.name} x${item.quantity} - $${item.price}</li>
              `).join('')}
            </ul>
          </details>
        `;
        historyContainer.appendChild(orderElement);
      }
    });
  } catch (error) {
    console.error('Error loading history:', error);
    alert('Error al cargar el historial');
  }
}