function closeCashRegister() {
  const closeData = {
    date: new Date().toISOString(),
    totalPayments: totalPayments,
    totalAmount: totalAmount,
    local: window.location.pathname.includes('local1') ? 'local1' : 'local2'
  };

  // Enviar al servidor para guardar el cierre de caja
  socket.emit('close-cash-register', closeData);

  // Reiniciar los contadores
  totalPayments = 0;
  totalAmount = 0;

  // Mostrar un mensaje de éxito
  alert(`Cierre de caja realizado:
- Pagos procesados: ${closeData.totalPayments}
- Monto total: $${closeData.totalAmount.toFixed(2)}`);
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

function confirmCloseCashRegister() {
    const confirmClose = confirm("¿Estás seguro de que deseas cerrar la caja?");
    if (confirmClose) {
      closeCashRegister(); // Llama a la función existente para cerrar la caja
    } else {
      alert("Cierre de caja cancelado.");
    }
  }