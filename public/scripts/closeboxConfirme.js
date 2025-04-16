// Add this at the top of the file
// Remove this line since socket is already declared elsewhere
// const socket = io();

// Add these variables at the top of the file
let orders = [];
let currentOrders = [];
let cashRegisterStartTime = null;

// Add this function to load orders
function loadOrders() {
  const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
  // Update to use the correct endpoint
  return fetch(`/api/orders/${local}`)
    .then(response => response.json())
    .then(data => {
      orders = data;
    })
    .catch(error => {
      console.error('Error loading orders:', error);
    });
}

// Call loadOrders when the page loads
document.addEventListener('DOMContentLoaded', loadOrders);

// Update your existing closeCashRegister function to ensure orders are loaded
function closeCashRegister() {
  if (!cashRegisterStartTime) {
    alert('Debe iniciar la caja antes de cerrarla');
    return;
  }

  // First load the latest orders
  loadOrders()
    .then(() => fetch('/cash-register'))
    .then(response => response.json())
    .then(data => {
      const closeData = {
        id: crypto.randomUUID(), // Add unique ID
        date: new Date().toISOString(),
        totalPayments,
        totalAmount,
        local: window.location.pathname.includes('local1') ? 'local1' : 'local2',
        closeTime: new Date().toISOString(),
        startTime: cashRegisterStartTime,
        productSummary: getProductSummary(),
        paymentSummary: {
          efectivo: paymentAmounts.efectivo || 0,
          transferencia: paymentAmounts.transferencia || 0,
          mixto: paymentAmounts.mixto || 0,
          total: totalAmount
        },
        ordersCount: currentOrders.length,
        orders: currentOrders
      };

      console.log('Sending close data:', closeData);

      return fetch('/api/cash-register/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(closeData)
      });
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Cierre de caja realizado con éxito');
        resetCounters();
      } else {
        throw new Error(data.error);
      }
    })
    .catch(error => {
      console.error('Error en el cierre de caja:', error);
      alert('Error al realizar el cierre de caja');
    });
}

socket.on('update-cash-register-history', (history) => {
  const historyContainer = document.getElementById('cash-register-history');
  historyContainer.innerHTML = '';

  history.forEach((entry, index) => {
    const entryElement = document.createElement('div');
    entryElement.className = 'cash-register-entry';
    entryElement.innerHTML = `
  <p><strong>Cierre #${index + 1}</strong></p>
  <p>Fecha: ${new Date(entry.date).toLocaleString()}</p>
  <p>Pagos procesados: ${entry.totalPayments}</p>
  <p>Monto total: $${entry.totalAmount.toFixed(2)}</p>
  <hr>
`;
    historyContainer.appendChild(entryElement);
  });
});

// Add this function before closeCashRegister
function getProductSummary() {
  const productSummary = [];
  const productMap = new Map();

  // Aggregate products from orders
  orders.forEach(order => {
    order.items.forEach(item => {
      if (productMap.has(item.name)) {
        const product = productMap.get(item.name);
        product.quantitySold += item.quantity;
        product.totalSold += item.price * item.quantity;
      } else {
        productMap.set(item.name, {
          name: item.name,
          price: item.price,
          quantitySold: item.quantity,
          totalSold: item.price * item.quantity,
          initialStock: item.initialStock || 0,
          remainingStock: item.remainingStock || 0
        });
      }
    });
  });

  // Convert Map to array
  productMap.forEach(product => {
    productSummary.push(product);
  });

  return productSummary;
}

// Remove variable declarations and just use the existing ones from payment.js
// Remove these variable declarations
// let totalPayments = 0;
// let totalAmount = 0;
// let orders = [];
// let paymentAmounts = { ... };

// Keep the rest of your functions
// Add this function to handle new orders
function addNewOrder(order) {
  if (cashRegisterStartTime) {
    currentOrders.push(order);
  }
}

// Modify resetCounters to also reset currentOrders
function resetCounters() {
    totalPayments = 0;
    totalAmount = 0;
    currentOrders = [];
    cashRegisterStartTime = null;
    paymentAmounts = {
        efectivo: 0,
        transferencia: 0,
        mixto: 0
    };
    
    // Safely handle button display
    const startBtn = document.getElementById('startCashRegisterBtn');
    const closeBtn = document.getElementById('closeCashRegisterBtn');
    if (startBtn) startBtn.style.display = 'block';
    if (closeBtn) closeBtn.style.display = 'none';
    
    fetch('/cash-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalPayments, totalAmount })
    });
}

function confirmCloseCashRegister() {
    const confirmClose = confirm("¿Estás seguro de que deseas cerrar la caja?");
    if (confirmClose) {
      closeCashRegister(); // Llama a la función existente para cerrar la caja
    } else {
      alert("Cierre de caja cancelado.");
    }
  }

// Add new function to start cash register
function startCashRegister() {
  cashRegisterStartTime = new Date().toISOString();
  currentOrders = [];
  
  fetch('/cash-register/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startTime: cashRegisterStartTime })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Caja iniciada con éxito');
      // Safely handle button display
      const startBtn = document.getElementById('startCashRegisterBtn');
      const closeBtn = document.getElementById('closeCashRegisterBtn');
      if (startBtn) startBtn.style.display = 'none';
      if (closeBtn) closeBtn.style.display = 'block';
    }
  })
  .catch(error => {
    console.error('Error al iniciar la caja:', error);
    alert('Error al iniciar la caja');
  });
}

// Add this at the bottom of the file
document.addEventListener('DOMContentLoaded', function() {
  // Add click event listeners to buttons
  const startBtn = document.getElementById('startCashRegisterBtn');
  const closeBtn = document.getElementById('closeCashRegisterBtn');
  
  if (startBtn) {
    startBtn.addEventListener('click', startCashRegister);
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', confirmCloseCashRegister);
  }
});