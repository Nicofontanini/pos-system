// Function to show the modal
function showCashRegisterHistoryModal() {
    const modal = document.getElementById('cashRegisterHistoryModal');
    modal.style.display = 'block';
    loadCashRegisterHistory();
}

// Function to close the modal
function closeCashRegisterHistoryModal() {
    const modal = document.getElementById('cashRegisterHistoryModal');
    modal.style.display = 'none';
}

// Function to load all cash register history
async function loadCashRegisterHistory() {
    try {
        console.log('Cargando historial de caja...');
        const response = await fetch('/api/cash-register-history');
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const history = await response.json();
        console.log('Datos recibidos:', history);
        displayCashRegisterHistory(history);
    } catch (error) {
        console.error('Error loading cash register history:', error);
        alert('Error al cargar el historial de cierres de caja');
    }
}

// Function to filter history by date range
async function filterCashRegisterHistory() {
    const startDate = document.getElementById('cashStartDate').value;
    const endDate = document.getElementById('cashEndDate').value;

    if (!startDate || !endDate) {
        alert('Por favor seleccione ambas fechas');
        return;
    }

    try {
        const response = await fetch('/api/cash-register-history/filter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ startDate, endDate })
        });
        const history = await response.json();
        displayCashRegisterHistory(history);
    } catch (error) {
        console.error('Error filtering cash register history:', error);
        alert('Error al filtrar el historial');
    }
}

// Function to display the history
function displayCashRegisterHistory(history) {
    const container = document.getElementById('cash-register-history');
    container.innerHTML = '';

    if (!history.length) {
        container.innerHTML = '<p>No hay registros para mostrar</p>';
        return;
    }

    const historyHTML = history.map(entry => {
        // Crear sección de descuentos si existen
        let discountsHTML = '';
        
        // Buscar descuentos en las órdenes
        if (entry.orders && entry.orders.length > 0) {
            const ordersWithDiscounts = entry.orders.filter(order => order.discountAmount && order.discountAmount > 0);
            
            if (ordersWithDiscounts.length > 0) {
                discountsHTML = `
                <div class="discount-summary">
                    <h4>Descuentos Aplicados:</h4>
                    ${ordersWithDiscounts.map(order => 
                        `<p class="discount-info">Descuento ${order.discountName || ''}: $${Math.floor(order.discountAmount || 0)}</p>`
                    ).join('')}
                </div>`;
            }
        }
        
        return `
        <div class="history-entry">
            <h3>Cierre de Caja - ${new Date(entry.closeTime).toLocaleDateString()}</h3>
            <p>Local: ${entry.local}</p>
            <p>Hora de Inicio: ${new Date(entry.startTime).toLocaleTimeString()}</p>
            <p>Hora de Cierre: ${new Date(entry.closeTime).toLocaleTimeString()}</p>
            <p>Total de Ventas: $${entry.totalAmount}</p>
            <p>Cantidad de Pagos: ${entry.totalPayments}</p>
            <div class="payment-summary">
                <h4>Resumen de Pagos:</h4>
                <p>Efectivo: $${entry.paymentSummary?.efectivo || 0}</p>
                <p>Transferencia: $${entry.paymentSummary?.transferencia || 0}</p>
                <p>Tarjeta: $${entry.paymentSummary?.tarjeta || 0}</p>
                <p>Mixto: $${entry.paymentSummary?.mixto || 0}</p>
            </div>
            ${discountsHTML}
        </div>
        `;
    }).join('');

    container.innerHTML = historyHTML;
}

// Function to print the history
function printCashRegisterHistory() {
    const printWindow = window.open('', '_blank');
    const historyContent = document.getElementById('cash-register-history').innerHTML;
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Historial de Cierres de Caja</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .history-entry { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                </style>
            </head>
            <body>
                <h1>Historial de Cierres de Caja</h1>
                ${historyContent}
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Function to download Excel
function downloadCashRegisterExcel() {
    const history = Array.from(document.querySelectorAll('.history-entry')).map(entry => {
        return {
            'Fecha': entry.querySelector('h3').textContent.split('-')[1].trim(),
            'Local': entry.querySelector('p').textContent.split(':')[1].trim(),
            'Total Ventas': entry.querySelectorAll('p')[3].textContent.split('$')[1].trim(),
            'Cantidad Pagos': entry.querySelectorAll('p')[4].textContent.split(':')[1].trim(),
            'Efectivo': entry.querySelectorAll('.payment-summary p')[0].textContent.split('$')[1].trim(),
            'Transferencia': entry.querySelectorAll('.payment-summary p')[1].textContent.split('$')[1].trim(),
            'Tarjeta': entry.querySelectorAll('.payment-summary p')[2].textContent.split('$')[1].trim(),
            'Mixto': entry.querySelectorAll('.payment-summary p')[3].textContent.split('$')[1].trim()
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(history);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cierres de Caja");
    XLSX.writeFile(workbook, "historial_cierres_caja.xlsx");
}