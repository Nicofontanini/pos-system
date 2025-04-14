// Funciones para el historial
async function showHistory() {
  const historyModal = document.getElementById('historyModal');
  historyModal.style.display = 'block';
  await filterHistory();
}

async function filterHistory() {
  try {
    const currentLocal = window.location.pathname.includes('local1') ? 'local1' : 'local2';
    const filterDate = document.getElementById('filterDate').value;
    
    // Get orders from the correct endpoint based on local
    const response = await fetch(`/api/orders/${currentLocal}`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const orders = await response.json();
    displayOrders(orders, filterDate);
  } catch (error) {
    console.error('Error fetching history:', error);
    alert('Error al cargar el historial');
  }
}

async function filterHistoryByDateRange() {
  try {
    const currentLocal = window.location.pathname.includes('local1') ? 'local1' : 'local2';
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    const response = await fetch(`/api/orders/${currentLocal}`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const orders = await response.json();
    displayOrdersByDateRange(orders, startDate, endDate);
  } catch (error) {
    console.error('Error fetching history:', error);
    alert('Error al cargar el historial');
  }
}

function displayOrders(orders, filterDate) {
  const historyContainer = document.getElementById('historyContainer');
  historyContainer.innerHTML = '';

  orders.forEach(order => {
    const orderDate = new Date(order.date).toLocaleDateString();
    if (!filterDate || orderDate === new Date(filterDate).toLocaleDateString()) {
      const orderElement = document.createElement('div');
      orderElement.className = 'history-item';
      orderElement.innerHTML = `
        <h3>Orden #${order.orderId}</h3>
        <p>Fecha: ${orderDate}</p>
        <p>Cliente: ${order.orderName || 'Sin nombre'}</p>
        <p>Vendedor: ${order.sellerName || 'Sin vendedor'}</p>
        <p>Total: $${order.total}</p>
        <p>Método de pago: ${order.paymentMethod}</p>
        <details>
          <summary>Ver items</summary>
          <ul>
            ${order.items ? order.items.map(item => `
              <li>${item.name} x${item.quantity} - $${item.price}</li>
            `).join('') : 'No hay items disponibles'}
          </ul>
        </details>
      `;
      historyContainer.appendChild(orderElement);
    }
  });
}

function displayOrdersByDateRange(orders, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59); // Include the entire end date

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.date);
    return orderDate >= start && orderDate <= end;
  });

  displayOrders(filteredOrders);
}

function closeHistoryModal() {
  const historyModal = document.getElementById('historyModal');
  historyModal.style.display = 'none';
}