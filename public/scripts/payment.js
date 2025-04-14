// Variables globales para el pago
// Verificar si la variable ya existe
if (typeof currentPaymentMethod === 'undefined') {
    let currentPaymentMethod = null;
}
let paymentAmounts = {
  efectivo: 0,
  transferencia: 0
};

// Variables globales para el carrito
let cart = [];
const socket = io();

// Variables globales para el cierre de caja
let totalPayments = 0;
let totalAmount = 0;

// Variables globales para el vendedor y el local
let selectedSeller = '';
let lastOrderData = null;

function showPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const total = document.getElementById('cart-total').textContent;
    document.getElementById('modalTotal').textContent = total;
    document.getElementById('remainingAmount').textContent = total;
    modal.style.display = 'block';
    
    // Reset payment inputs
    document.getElementById('paymentInputs').innerHTML = '';
    document.getElementById('processPaymentBtn').disabled = true;
    document.getElementById('orderName').value = '';

    // Agregar el event listener al botón de procesar pago
    document.getElementById('processPaymentBtn').addEventListener('click', processPayment);
}

function closePaymentModal() {
  document.getElementById('paymentModal').style.display = 'none';
  document.getElementById('printOrderBtn').style.display = 'none';
}

function selectPaymentMethod(method) {
  currentPaymentMethod = method;
  updatePaymentInputs(method);  // Pasar el método como parámetro
}

function updatePaymentInputs(method) {
    const container = document.getElementById('paymentInputs');
    const total = document.getElementById('modalTotal').textContent;
    container.innerHTML = '';

    if (currentPaymentMethod === 'mixto') {
        container.innerHTML = `
            <div class="payment-input">
                <label>Monto en efectivo:</label>
                <input type="number" id="cashAmount" step="0.01" value="" onchange="updateRemainingAmount()">
            </div>
            <div class="payment-input">
                <label>Monto transferencia:</label>
                <input type="number" id="transferAmount" step="0.01" value="" onchange="updateRemainingAmount()">
            </div>
        `;
    } else if (currentPaymentMethod === 'tarjeta') {
        container.innerHTML = `
            <div class="payment-input">
                <label>Monto tarjeta:</label>
                <input type="number" id="singleAmount" step="0.01" value="" onchange="updateRemainingAmount()">
            </div>
            <div class="payment-input">
                <label>Recargo (%):</label>
                <input type="number" id="cardSurcharge" min="0" max="100" step="0.1" value="0" onchange="updateCardAmount()">
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="payment-input">
                <label>Monto ${currentPaymentMethod}:</label>
                <input type="number" id="singleAmount" step="0.01" value="" onchange="updateRemainingAmount()">
            </div>
        `;
    }
    
    // Reset remaining amount display
    document.getElementById('remainingAmount').textContent = total;
}

function updateRemainingAmount() {
  const total = parseFloat(document.getElementById('modalTotal').textContent);
  let paid = 0;

  if (currentPaymentMethod === 'mixto') {
    const cashAmount = parseFloat(document.getElementById('cashAmount').value) || 0;
    const transferAmount = parseFloat(document.getElementById('transferAmount').value) || 0;
    paid = cashAmount + transferAmount;
    paymentAmounts.efectivo = cashAmount;
    paymentAmounts.transferencia = transferAmount;
  } else {
    paid = parseFloat(document.getElementById('singleAmount').value) || 0;
    paymentAmounts[currentPaymentMethod] = paid;
  }

  const remaining = total - paid;
  document.getElementById('remainingAmount').textContent = remaining.toFixed(2);
  document.getElementById('processPaymentBtn').disabled = remaining !== 0;
}

function updateCardAmount() {
  const amount = parseFloat(document.getElementById('singleAmount').value) || 0;
  const surcharge = parseFloat(document.getElementById('cardSurcharge').value) || 0;
  const totalWithSurcharge = amount + (amount * surcharge / 100);
  paymentAmounts[currentPaymentMethod] = totalWithSurcharge;
  updateRemainingAmount();
}

function updateCardAmount() {
  const amount = parseFloat(document.getElementById('singleAmount').value) || 0;
  const surcharge = parseFloat(document.getElementById('cardSurcharge').value) || 0;
  const totalWithSurcharge = amount + (amount * surcharge / 100);
  paymentAmounts[currentPaymentMethod] = totalWithSurcharge;
  updateRemainingAmount();
}


// Función para cargar los contadores desde el backend
function loadCashRegisterCounters() {
  fetch('/cash-register')
    .then(response => response.json())
    .then(data => {
      totalPayments = data.totalPayments;
      totalAmount = data.totalAmount;
    })
    .catch(error => console.error('Error al cargar los contadores:', error));
}

// Función para actualizar los contadores en el backend
function updateCashRegisterCounters() {
  fetch('/cash-register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ totalPayments, totalAmount })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Contadores actualizados en el backend');
      }
    })
    .catch(error => console.error('Error al actualizar los contadores:', error));
}

// Llamar a loadCashRegisterCounters al cargar la página
document.addEventListener('DOMContentLoaded', loadCashRegisterCounters);

// Función para procesar el pago
async function processPayment() {
  const orderName = document.getElementById('orderName').value;
  let total = parseFloat(document.getElementById('modalTotal').textContent);
  let finalTotal = total;

  // Si es pago con tarjeta, calculamos el total con el recargo
  if (currentPaymentMethod === 'tarjeta') {
    const surcharge = parseFloat(document.getElementById('cardSurcharge').value) || 0;
    finalTotal = total + (total * surcharge / 100);
  }

  const orderData = {
    date: new Date().toISOString(),
    items: cart,
    total: finalTotal,
    originalTotal: total,
    paymentMethod: currentPaymentMethod,
    surchargePercent: currentPaymentMethod === 'tarjeta' ? parseFloat(document.getElementById('cardSurcharge').value) || 0 : 0,
    paymentAmounts: paymentAmounts,
    local: window.location.pathname.includes('local1') ? 'local1' : 'local2',
    orderName: orderName,
    sellerName: selectedSeller
  };

  try {
    // Save order to database
    const response = await fetch(`/api/orders/${orderData.local}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error('Failed to save order');
    }

    // Continue with existing functionality after successful save
    lastOrderData = orderData;
    totalPayments++;
    totalAmount += orderData.total;
    updateCashRegisterCounters();
    socket.emit('process-order', orderData);

    // Clear cart and UI
    cart = [];
    updateCartUI();
    document.getElementById('orderName').value = '';

    // Show print button
    const printOrderBtn = document.getElementById('printOrderBtn');
    printOrderBtn.style.display = 'block';
    document.getElementById('processPaymentBtn').disabled = true;
    printOrderBtn.onclick = () => printOrder(lastOrderData);

  } catch (error) {
    console.error('Error saving order:', error);
    alert('Error al guardar la orden. Por favor, intente nuevamente.');
  }
}

// Eliminar este event listener duplicado
// document.addEventListener('DOMContentLoaded', function () {
//   const printOrderBtn = document.getElementById('printOrderBtn');
//   if (printOrderBtn) {
//     printOrderBtn.addEventListener('click', () => {
//       if (lastOrderData) {
//         printOrder(lastOrderData);
//       }
//     });
//   }
// });

// Función mejorada para imprimir el pedido
function printOrder(orderData) {
  // Usar la misma función de generación de contenido que el historial
  const printContent = generateOrderPrintContent(orderData);

  try {
    // Abrir ventana de impresión con características específicas
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Esperar a que el contenido se cargue antes de imprimir
      printWindow.onload = function () {
        try {
          printWindow.print();
        } catch (error) {
          console.error('Error al imprimir:', error);
        }
      };
    } else {
      console.error('No se pudo abrir la ventana de impresión');
      alert('Por favor, permita las ventanas emergentes para imprimir');
    }
  } catch (error) {
    console.error('Error al crear la ventana de impresión:', error);
  }
}

function generateOrderPrintContent(orderData) {
  const date = new Date(orderData.date).toLocaleString();

  // Verificar explícitamente los valores
  const clientName = orderData.orderName ? orderData.orderName : 'No especificado';
  const vendorName = orderData.sellerName ? orderData.sellerName : 'No especificado';

  console.log("Imprimiendo - Nombre del cliente:", clientName);
  console.log("Imprimiendo - Nombre del vendedor:", vendorName);

  let paymentDetails = '';

  if (orderData.paymentMethod === 'mixto') {
    paymentDetails = `
      <p>Pago en efectivo: $${orderData.paymentAmounts.efectivo.toFixed(2)}</p>
      <p>Pago por transferencia: $${orderData.paymentAmounts.transferencia.toFixed(2)}</p>
    `;
  } else if (orderData.paymentMethod === 'tarjeta') {
    paymentDetails = `
      <p>Total: $${orderData.total.toFixed(2)}</p>
      <p>Subtotal: $${orderData.originalTotal.toFixed(2)}</p>
      <p>Recargo (${orderData.surchargePercent}%): $${(orderData.total - orderData.originalTotal).toFixed(2)}</p>
    `;
  } else {
    paymentDetails = `
      <p>Total: $${orderData.total.toFixed(2)}</p>
    `;
  }

  // Generar el detalle de las docenas si existen
  let docenaDetails = '';
  orderData.items.forEach(item => {
    if (item.details) {
      docenaDetails += `
        <div class="docena-detail">
          <h4>${item.name}</h4>
          <ul>
            ${item.details.map(detail => `
              <li style="list-style-type: none;">${detail.name} x ${detail.quantity}</li>
            `).join('')}
          </ul>
        </div>
      `;
    }
  });

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" href="/styles/base.css">
      <link rel="stylesheet" href="/styles/styles.css">
      <style>
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.9rem;
        }

        .print-table th {
          background-color: var(--color-light);
          color: var(--color-text);
          font-weight: 600;
          text-align: left;
          padding: 0.5rem;
          border: 1px solid var(--color-border);
        }

        .print-table td {
          padding: 0.5rem;
          border: 1px solid var(--color-border);
          vertical-align: top;
        }

        .print-table .product-name {
          font-weight: 500;
          color: var(--color-text);
        }

        .print-table .quantity {
          text-align: right;
          color: var(--color-text-light);
        }

        .print-table .price {
          text-align: right;
          color: var(--color-text);
          font-weight: 500;
        }

        .print-table .subtotal {
          text-align: right;
          color: var(--color-success);
          font-weight: 600;
        }

        .print-table .total-row {
          background-color: var(--color-light);
          font-weight: 600;
        }

        .print-table .total-row td {
          border-top: 2px solid var(--color-border);
        }

        .print-table .total-amount {
          color: var(--color-success);
          font-size: 1.1rem;
        }

        .order-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .order-info div {
          background-color: var(--color-light);
          padding: 1rem;
          border-radius: var(--border-radius-sm);
        }

        .order-info h4 {
          margin: 0 0 0.5rem 0;
          color: var(--color-primary);
        }

        .docena-detail {
          margin: 1rem 0;
          padding: 1rem;
          background-color: var(--color-light);
          border-radius: var(--border-radius-sm);
        }

        .docena-detail h4 {
          margin: 0 0 0.5rem 0;
          color: var(--color-primary);
        }

        .docena-detail ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }

        .docena-detail li {
          margin: 0.25rem 0;
          padding: 0.25rem 0;
        }

        .payment-info {
          margin: 1rem 0;
          padding: 1rem;
          background-color: var(--color-light);
          border-radius: var(--border-radius-sm);
        }

        .payment-info h3 {
          margin: 0 0 0.5rem 0;
          color: var(--color-primary);
        }

        .payment-info p {
          margin: 0.25rem 0;
        }
      </style>
    </head>
    <body>
      <h2>EMPANDAS KM11</h2>
      <h3>Comanda</h3>
      <p>Fecha: ${date}</p>
      
      <div class="order-info">
        <div class="customer-info">
          <h4>Información del Cliente</h4>
          <p>Nombre: ${clientName}</p>
        </div>

        <div class="seller-info">
          <h4>Información del Vendedor</h4>
          <p>Vendedor: ${vendorName}</p>
        </div>

        <div class="payment-info">
          <h4>Información de Pago</h4>
          <p>Método de pago: ${orderData.paymentMethod}</p>
          ${paymentDetails}
        </div>
      </div>

      <table class="print-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${orderData.items.map(item => `
            <tr>
              <td class="product-name">${item.name}</td>
              <td class="quantity">${item.quantity || 1}</td>
              <td class="price">$${item.price.toFixed(2)}</td>
              <td class="subtotal">$${(item.price * (item.quantity || 1)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3">Total</td>
            <td class="total-amount">$${orderData.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${docenaDetails}

      <h2>Gracias</h2>
    </body>
    </html>
  `;

  return printContent;
}