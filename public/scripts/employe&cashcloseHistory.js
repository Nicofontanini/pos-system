function printEmployeeHistory() {
    const historyContent = document.getElementById('employeeHistoryContainer').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial; }
  .history-entry { margin-bottom: 20px; }
</style>
</head>
<body>
<h2>Historial de Cambios de Empleados</h2>
${historyContent}
</body>
</html>
`);
    printWindow.document.close();
    printWindow.print();
}

// Función para mostrar el modal de historial de empleados
function showEmployeeHistoryModal() {
    const modal = document.getElementById('employeeHistoryModal');
    modal.style.display = 'block'; // Mostrar el modal
    loadEmployeeHistory(); // Cargar el historial
}

// Función para cerrar el modal de historial de empleados
function closeEmployeeHistoryModal() {
    document.getElementById('employeeHistoryModal').style.display = 'none';
}

// Función para cargar el historial de empleados
function loadEmployeeHistory() {
    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';

    fetch(`/get-sellers-history?local=${local}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('employeeHistoryContainer');
            container.innerHTML = '';

            data.forEach(entry => {
                const entryElement = document.createElement('div');
                entryElement.className = 'history-entry';
                entryElement.innerHTML = `
    <p><strong>Local:</strong> ${entry.local}</p>
    <p><strong>Vendedor:</strong> ${entry.seller}</p>
    <p><strong>Nombre anterior:</strong> ${entry.oldName || 'N/A'}</p>
    <p><strong>Nombre nuevo:</strong> ${entry.newName}</p>
    <p><strong>Fecha de cambio:</strong> ${new Date(entry.updatedAt).toLocaleString()}</p>
    <hr>
  `;
                container.appendChild(entryElement);
            });
        })
        .catch(error => {
            console.error('Error al cargar el historial de empleados:', error);
        });
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
<p>Nombre del Cliente: ${order.orderName}</p> <!-- Nombre del pedido -->
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
<style>
  body { font-family: Arial; }
  .order-card { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
</style>
</head>
<body>
<h2>Historial de comandas</h2>
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

// En el cliente (tu archivo HTML/JS)
socket.on('cash-register-updated', function (updatedRegister) {
    totalPayments = updatedRegister.totalPayments;
    totalAmount = updatedRegister.totalAmount;
    console.log('Contadores reiniciados:', totalPayments, totalAmount);
});

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

function loadCashRegisterHistory() {
    console.log('Solicitando historial de cierres de caja...');
    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
    
    // Obtener fechas de filtro si existen
    const startDate = document.getElementById('cashStartDate')?.value || '';
    const endDate = document.getElementById('cashEndDate')?.value || '';
    
    // Solicitar el historial de cierres de caja al servidor usando socket
    socket.emit('get-cash-register-history', { local, startDate, endDate });
    
    // Mostrar indicador de carga
    const historyContainer = document.getElementById('cash-register-history');
    if (historyContainer) {
        historyContainer.innerHTML = '<p>Cargando historial...</p>';
    }
}

// Función para filtrar el historial por fechas
function filterCashRegisterHistory() {
    const startDate = document.getElementById('cashStartDate').value;
    const endDate = document.getElementById('cashEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Por favor seleccione ambas fechas');
        return;
    }
    
    loadCashRegisterHistory(); // Reutilizamos la misma función
}

// Actualizar la función que muestra el historial
socket.on('update-cash-register-history', (history) => {
    const historyContainer = document.getElementById('cash-register-history');
    historyContainer.innerHTML = '';

    // Ordenar del más reciente al más antiguo
    history.reverse().forEach((entry, index) => {
        const entryElement = document.createElement('div');
        entryElement.className = 'cash-register-entry';

        // Formatear fechas
        const closeTime = new Date(entry.closeTime);
        const startTime = new Date(entry.startTime);
        const formattedCloseTime = closeTime.toLocaleDateString() + ' ' + closeTime.toLocaleTimeString();
        const formattedStartTime = startTime.toLocaleDateString() + ' ' + startTime.toLocaleTimeString();

        // Crear resumen de productos con stock
        let productsHTML = `
<h4>Productos Vendidos (${entry.productSummary.length}):</h4>
<table class="summary-table">
  <tr>
    <th>Producto</th>
    <th>Precio</th>
    <th>Vendidos</th>
    <th>Stock Inicial</th>
    <th>Stock Restante</th>
    <th>Total</th>
  </tr>
`;

        entry.productSummary.forEach(product => {
            productsHTML += `
  <tr>
    <td>${product.name}</td>
    <td>$${product.price.toFixed(2)}</td>
    <td>${product.quantitySold}</td>
    <td>${product.initialStock}</td>
    <td class="${product.remainingStock <= 5 ? 'low-stock' : ''}">${product.remainingStock}</td>
    <td>$${product.totalSold.toFixed(2)}</td>
  </tr>
`;
        });

        productsHTML += '</table>';

        // Crear resumen de pagos detallado
        let paymentsHTML = `
<h4>Métodos de Pago:</h4>
<table class="payment-table">
  <tr>
    <th>Método</th>
    <th>Monto</th>
    <th>% del Total</th>
  </tr>
  <tr>
    <td>Efectivo</td>
    <td>$${entry.paymentSummary.efectivo.toFixed(2)}</td>
    <td>${((entry.paymentSummary.efectivo / entry.paymentSummary.total) * 100).toFixed(1)}%</td>
  </tr>
  <tr>
    <td>Transferencia</td>
    <td>$${entry.paymentSummary.transferencia.toFixed(2)}</td>
    <td>${((entry.paymentSummary.transferencia / entry.paymentSummary.total) * 100).toFixed(1)}%</td>
  </tr>
  <tr>
    <td>Mixto</td>
    <td>$${entry.paymentSummary.mixto.toFixed(2)}</td>
    <td>${((entry.paymentSummary.mixto / entry.paymentSummary.total) * 100).toFixed(1)}%</td>
  </tr>
  <tr class="total-row">
    <td><strong>TOTAL</strong></td>
    <td><strong>$${entry.paymentSummary.total.toFixed(2)}</strong></td>
    <td>100%</td>
  </tr>
</table>
`;

entryElement.innerHTML = `
<div class="entry-header">
  <h3>Cierre #${history.length - index} - ${formattedCloseTime}</h3>
  <p><strong>Local:</strong> ${entry.local.toUpperCase()}</p>
  <p><strong>Período:</strong> ${formattedStartTime} a ${formattedCloseTime}</p>
  <p><strong>Total Ventas:</strong> $${entry.paymentSummary.total.toFixed(2)}</p>
  <p><strong>Pedidos Procesados:</strong> ${entry.ordersCount}</p>
  <div class="button-group">
    <button onclick="downloadSingleCashRegister('${entry.id}')" class="download-btn">Descargar Excel</button>
    <button onclick="printSingleCashRegister('${entry.id}')" class="print-btn">Imprimir</button>
  </div>
</div>
<div class="entry-details">
  <button class="toggle-details" onclick="toggleDetails(this)">Mostrar Detalles</button>
  <div class="details-content" style="display:none;">
    ${productsHTML}
    ${paymentsHTML}
    <h4>Pedidos incluidos (${entry.orders.length}):</h4>
  </div>
</div>
<hr>
`;

        historyContainer.appendChild(entryElement);
    });
     // Si no hay resultados, mostrar mensaje
     if (history.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = '<p>No se encontraron cierres de caja en el período especificado.</p>';
        historyContainer.appendChild(noResults);
    }
});

// Función para mostrar/ocultar detalles
function toggleDetails(button) {
    const details = button.nextElementSibling;
    if (details.style.display === 'none') {
        details.style.display = 'block';
        button.textContent = 'Ocultar Detalles';
    } else {
        details.style.display = 'none';
        button.textContent = 'Mostrar Detalles';
    }
}
// Función para abrir el modal del historial de cierres de caja
function showCashRegisterHistoryModal() {
    const modal = document.getElementById('cashRegisterHistoryModal');
    modal.style.display = 'block';
    loadCashRegisterHistory(); // Cargar el historial al abrir el modal
}

// Función para cerrar el modal del historial de cierres de caja
function closeCashRegisterHistoryModal() {
    const modal = document.getElementById('cashRegisterHistoryModal');
    modal.style.display = 'none';
}

function printSingleCashRegister(id) {
    socket.emit('get-single-cash-register', { id: id, forPrint: true });
}

// Modificar el evento para manejar tanto la descarga como la impresión
socket.on('single-cash-register', (entry) => {
    if (!entry) {
        console.error('No se recibieron datos del cierre de caja');
        alert('No se pudo obtener la información del cierre de caja');
        return;
    }
    
    // Si es para imprimir, crear una ventana de impresión
    if (entry.forPrint === true) {
        // Crear contenido HTML para imprimir
        let printContent = `
        <html>
        <head>
            <title>Cierre de Caja - ${entry.local} - ${new Date(entry.closeTime).toLocaleDateString()}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; margin-bottom: 20px; }
                .info { margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total-row { font-weight: bold; background-color: #f9f9f9; }
                .section-title { margin-top: 20px; margin-bottom: 10px; font-weight: bold; }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <button onclick="window.print()" style="padding: 10px; margin-bottom: 20px;">Imprimir</button>
            <h1>INFORME DE CIERRE DE CAJA</h1>
            
            <div class="info">
                <p><strong>Local:</strong> ${entry.local.toUpperCase()}</p>
                <p><strong>Fecha cierre:</strong> ${new Date(entry.closeTime).toLocaleString()}</p>
                <p><strong>Período:</strong> ${new Date(entry.startTime).toLocaleString()} - ${new Date(entry.closeTime).toLocaleString()}</p>
                <p><strong>Total:</strong> $${entry.paymentSummary.total.toFixed(2)}</p>
            </div>
            
            <div class="section-title">MÉTODOS DE PAGO</div>
            <table>
                <tr>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Porcentaje</th>
                </tr>`;
                
        ['efectivo', 'transferencia', 'mixto'].forEach(method => {
            if (entry.paymentSummary[method] > 0) {
                printContent += `
                <tr>
                    <td>${method.charAt(0).toUpperCase() + method.slice(1)}</td>
                    <td>$${entry.paymentSummary[method].toFixed(2)}</td>
                    <td>${((entry.paymentSummary[method]/entry.paymentSummary.total)*100).toFixed(2)}%</td>
                </tr>`;
            }
        });
                
        printContent += `
                <tr class="total-row">
                    <td>TOTAL</td>
                    <td>$${entry.paymentSummary.total.toFixed(2)}</td>
                    <td>100%</td>
                </tr>
            </table>`;
            
        if (entry.productSummary?.length > 0) {
            printContent += `
            <div class="section-title">PRODUCTOS VENDIDOS</div>
            <table>
                <tr>
                    <th>Nombre</th>
                    <th>Precio Unitario</th>
                    <th>Cantidad</th>
                    <th>Stock Inicial</th>
                    <th>Stock Restante</th>
                    <th>Total</th>
                </tr>`;
                
            entry.productSummary.forEach(p => {
                printContent += `
                <tr>
                    <td>${p.name}</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td>${p.quantitySold}</td>
                    <td>${p.initialStock}</td>
                    <td>${p.remainingStock}</td>
                    <td>$${p.totalSold.toFixed(2)}</td>
                </tr>`;
            });
                
            printContent += `</table>`;
        }
            
        if (entry.orders?.length > 0) {
            printContent += `
            <div class="section-title">PEDIDOS INCLUIDOS</div>
            <table>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Vendedor</th>
                    <th>Total</th>
                    <th>Método de Pago</th>
                </tr>`;
                
            entry.orders.forEach(order => {
                printContent += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.orderName}</td>
                    <td>${order.sellerName}</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td>${order.paymentMethod}</td>
                </tr>`;
            });
                
            printContent += `</table>`;
        }
            
        printContent += `
        </body>
        </html>`;
            
        // Abrir ventana de impresión
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        return;
    }
    
    // Si no es para imprimir, continuar con la descarga del Excel
    // El código existente para la descarga de Excel se mantiene igual
});

document.addEventListener('DOMContentLoaded', function () {
    loadSellerInfo();
});

function downloadCashRegisterExcel() {
    const historyContainer = document.getElementById('cash-register-history');
    const entries = Array.from(historyContainer.querySelectorAll('.cash-register-entry'));
    
    // Crear un libro de trabajo nuevo
    const workbook = XLSX.utils.book_new();
    
    // Para cada entrada de cierre de caja, crear una hoja separada
    entries.forEach((entry, index) => {
        // Extraer información básica
        const title = entry.querySelector('.entry-header h3').textContent.trim();
        const date = title.split(' - ')[1]?.trim() || 'Sin fecha';
        
        // Preparar los datos en formato vertical
        const data = [];
        
        // Información general - Sección 1
        data.push(['INFORMACIÓN GENERAL', '']);
        data.push(['Cierre', title.split(' - ')[0]?.trim() || 'Sin número']);
        data.push(['Fecha', date]);
        
        // Con la nueva estructura HTML, necesitamos ajustar cómo extraemos la información
        // Extraer desde la tabla consolidada
        const consolidatedTable = entry.querySelector('.consolidated-table');
        if (consolidatedTable) {
            // Extraer datos de información general (primera sección de la tabla)
            const infoRows = consolidatedTable.querySelectorAll('tbody')[0]?.querySelectorAll('tr');
            if (infoRows && infoRows.length > 0) {
                const cells = infoRows[0].querySelectorAll('td');
                if (cells.length >= 6) {
                    data.push(['Local', cells[0].textContent.trim()]);
                    data.push(['Período', cells[1].textContent.trim()]);
                    data.push(['Total Ventas', cells[2].textContent.trim()]);
                    data.push(['Pedidos Procesados', cells[3].textContent.trim()]);
                    data.push(['Efectivo', cells[4].textContent.trim()]);
                    data.push(['Transferencia', cells[5].textContent.trim()]);
                }
            }
            
            // Añadimos una sección específica para métodos de pago
            data.push(['', '']);
            data.push(['MÉTODOS DE PAGO', '']);
            data.push(['Método', 'Monto', 'Porcentaje']);
            
            if (infoRows && infoRows.length > 0) {
                const cells = infoRows[0].querySelectorAll('td');
                if (cells.length >= 6) {
                    // Extrayendo efectivo y transferencia de las celdas
                    // Ejemplo: "$1000.00 (50.0%)" -> separamos en "$1000.00" y "50.0%"
                    const efectivoCell = cells[4].textContent.trim();
                    const transferenciaCell = cells[5].textContent.trim();
                    
                    // Extrae el monto y porcentaje para efectivo
                    const efectivoMatch = efectivoCell.match(/\$([\d.]+)\s*\(([\d.]+)%\)/);
                    if (efectivoMatch && efectivoMatch.length >= 3) {
                        data.push(['Efectivo', `$${efectivoMatch[1]}`, `${efectivoMatch[2]}%`]);
                    } else {
                        data.push(['Efectivo', efectivoCell, '']);
                    }
                    
                    // Extrae el monto y porcentaje para transferencia
                    const transferenciaMatch = transferenciaCell.match(/\$([\d.]+)\s*\(([\d.]+)%\)/);
                    if (transferenciaMatch && transferenciaMatch.length >= 3) {
                        data.push(['Transferencia', `$${transferenciaMatch[1]}`, `${transferenciaMatch[2]}%`]);
                    } else {
                        data.push(['Transferencia', transferenciaCell, '']);
                    }
                    
                    // Si hay información de pago mixto, la extraemos de la estructura antigua
                    // o la calculamos si es necesario
                    const mixtoElement = entry.querySelector('.payment-table tr:nth-child(4) td:nth-child(2)');
                    if (mixtoElement) {
                        const mixtoValue = mixtoElement.textContent.trim();
                        const mixtoPercentElement = entry.querySelector('.payment-table tr:nth-child(4) td:nth-child(3)');
                        const mixtoPercent = mixtoPercentElement ? mixtoPercentElement.textContent.trim() : '';
                        data.push(['Mixto', mixtoValue, mixtoPercent]);
                    }
                    
                    // Calcular el total
                    const totalVentas = cells[2].textContent.trim();
                    data.push(['TOTAL', totalVentas, '100%']);
                }
            }
            
            // Espacio en blanco para mejor legibilidad
            data.push(['', '']);
            data.push(['PRODUCTOS VENDIDOS', '']);
            
            // Cabeceras para productos
            data.push(['Producto', 'Precio', 'Vendidos', 'Stock Inicial', 'Stock Restante', 'Total']);
            
            // Extraer datos de productos (segunda sección de la tabla)
            const productRows = consolidatedTable.querySelectorAll('tbody')[1]?.querySelectorAll('tr');
            if (productRows && productRows.length > 0) {
                productRows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 6) {
                        data.push([
                            cells[0].textContent.trim(),  // Producto
                            cells[1].textContent.trim(),  // Precio
                            cells[2].textContent.trim(),  // Vendidos
                            cells[3].textContent.trim(),  // Stock Inicial
                            cells[4].textContent.trim(),  // Stock Restante
                            cells[5].textContent.trim()   // Total
                        ]);
                    }
                });
            }
            
            // Espacio en blanco para mejor legibilidad
            data.push(['', '']);
            data.push(['PEDIDOS INCLUIDOS', '']);
            
            // Cabeceras para pedidos
            data.push(['ID', 'Nombre', 'Vendedor', 'Total', 'Método de Pago']);
            
            // Extraer datos de pedidos (tercera sección de la tabla)
            const orderRows = consolidatedTable.querySelectorAll('tbody')[2]?.querySelectorAll('tr');
            if (orderRows && orderRows.length > 0) {
                orderRows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 5) {
                        data.push([
                            cells[0].textContent.trim(),  // ID
                            cells[1].textContent.trim(),  // Nombre
                            cells[2].textContent.trim(),  // Vendedor
                            cells[3].textContent.trim(),  // Total
                            cells[4].textContent.trim()   // Método de Pago
                        ]);
                    }
                });
            }
        } else {
            // Compatibilidad con la estructura antigua
            // Si no encontramos la tabla consolidada, intentamos extraer desde los elementos p y tablas
            const paragraphs = entry.querySelectorAll('.entry-header p');
            if (paragraphs.length >= 3) {
                paragraphs.forEach(p => {
                    const text = p.textContent.trim();
                    if (text.includes('Local:')) {
                        data.push(['Local', text.replace('Local:', '').trim()]);
                    } else if (text.includes('Total Ventas:')) {
                        data.push(['Total Ventas', text.replace('Total Ventas:', '').trim()]);
                    } else if (text.includes('Pedidos Procesados:')) {
                        data.push(['Pedidos Procesados', text.replace('Pedidos Procesados:', '').trim()]);
                    }
                });
            }
            
            // Extraer información de métodos de pago
            const paymentTable = entry.querySelector('.payment-table');
            if (paymentTable) {
                data.push(['', '']);
                data.push(['MÉTODOS DE PAGO', '']);
                data.push(['Método', 'Monto', 'Porcentaje']);
                
                const paymentRows = paymentTable.querySelectorAll('tr');
                paymentRows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                        const method = cells[0].textContent.trim();
                        const amount = cells[1].textContent.trim();
                        const percent = cells[2].textContent.trim();
                        // No incluir la fila de cabecera
                        if (method && amount && !method.includes('Método')) {
                            data.push([method, amount, percent]);
                        }
                    }
                });
            }
            
            // Intenta extraer información de productos desde la tabla anterior
            const productsTable = entry.querySelector('.summary-table');
            if (productsTable) {
                data.push(['', '']);
                data.push(['PRODUCTOS VENDIDOS', '']);
                
                const rows = Array.from(productsTable.querySelectorAll('tr'));
                // Añadir cabeceras
                const headers = rows[0]?.querySelectorAll('th');
                if (headers && headers.length > 0) {
                    data.push([...Array.from(headers).map(th => th.textContent.trim())]);
                }
                
                // Añadir filas de datos
                rows.slice(1).forEach(row => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    if (cells.length > 0) {
                        data.push([...cells.map(td => td.textContent.trim())]);
                    }
                });
            }
            
            // Extraer información de pedidos
            const ordersTable = entry.querySelector('.orders-table');
            if (ordersTable) {
                data.push(['', '']);
                data.push(['PEDIDOS INCLUIDOS', '']);
                
                const headers = ordersTable.querySelectorAll('th');
                if (headers.length > 0) {
                    data.push([...Array.from(headers).map(th => th.textContent.trim())]);
                }
                
                const orderRows = ordersTable.querySelectorAll('tr:not(:first-child)');
                orderRows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length > 0) {
                        data.push([...Array.from(cells).map(td => td.textContent.trim())]);
                    }
                });
            }
        }
        
        // Crear una hoja para este cierre
        const sheetName = `Cierre ${index + 1}`;
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // Aplicar estilos básicos (ancho de columnas)
        const wscols = [
            {wch: 25},  // Primera columna más ancha para etiquetas
            {wch: 30},  // Segunda columna para valores
            {wch: 15},  // Columnas adicionales para tablas de productos y pedidos
            {wch: 15},
            {wch: 15},
            {wch: 15}
        ];
        
        worksheet['!cols'] = wscols;
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    // Añadir una hoja de resumen con todos los cierres
    const summaryData = [
        ['RESUMEN DE CIERRES DE CAJA', '', '', '', '', '', ''],
        ['Cierre', 'Fecha', 'Local', 'Total Ventas', 'Pedidos', 'Efectivo', 'Transferencia']
    ];
    
    entries.forEach(entry => {
        const title = entry.querySelector('.entry-header h3').textContent.trim();
        const cierre = title.split(' - ')[0]?.trim() || 'Sin número';
        const fecha = title.split(' - ')[1]?.trim() || 'Sin fecha';
        
        // Variables para datos
        let local = '';
        let totalVentas = '';
        let pedidos = '';
        let efectivo = '';
        let transferencia = '';
        
        // Intentar obtener datos de la nueva estructura
        const consolidatedTable = entry.querySelector('.consolidated-table');
        if (consolidatedTable) {
            const infoRow = consolidatedTable.querySelectorAll('tbody')[0]?.querySelector('tr');
            if (infoRow) {
                const cells = infoRow.querySelectorAll('td');
                if (cells.length >= 6) {
                    local = cells[0].textContent.trim();
                    totalVentas = cells[2].textContent.trim();
                    pedidos = cells[3].textContent.trim();
                    efectivo = cells[4].textContent.trim();
                    transferencia = cells[5].textContent.trim();
                }
            }
        } else {
            // Compatibilidad con estructura antigua
            const paragraphs = entry.querySelectorAll('.entry-header p');
            paragraphs.forEach(p => {
                const text = p.textContent.trim();
                if (text.includes('Local:')) {
                    local = text.replace('Local:', '').trim();
                } else if (text.includes('Total Ventas:')) {
                    totalVentas = text.replace('Total Ventas:', '').trim();
                } else if (text.includes('Pedidos Procesados:')) {
                    pedidos = text.replace('Pedidos Procesados:', '').trim();
                }
            });
            
            // Intentar obtener métodos de pago de la estructura antigua
            const paymentTable = entry.querySelector('.payment-table');
            if (paymentTable) {
                const efectivoRow = paymentTable.querySelector('tr:nth-child(2)');
                if (efectivoRow) {
                    const efectivoCell = efectivoRow.querySelector('td:nth-child(2)');
                    if (efectivoCell) {
                        efectivo = efectivoCell.textContent.trim();
                    }
                }
                
                const transferenciaRow = paymentTable.querySelector('tr:nth-child(3)');
                if (transferenciaRow) {
                    const transferenciaCell = transferenciaRow.querySelector('td:nth-child(2)');
                    if (transferenciaCell) {
                        transferencia = transferenciaCell.textContent.trim();
                    }
                }
            }
        }
        
        summaryData.push([cierre, fecha, local, totalVentas, pedidos, efectivo, transferencia]);
    });
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    
    // Generar archivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'historial_cierres_caja_detallado.xlsx';
    link.click();
    URL.revokeObjectURL(url);
}

function downloadExcel() {
    // Obtener los datos del historial de pedidos
    const historyContainer = document.getElementById('historyContainer');
    const orders = Array.from(historyContainer.querySelectorAll('.order-card'));

    // Crear un array de objetos con los datos
    const data = orders.map(order => {
        // Obtener el texto completo de la fecha
        const fullDateText = order.querySelector('p:nth-child(1)').textContent.replace('Fecha: ', '');

        // Separar la fecha y la hora manualmente
        let dateOnly = '';
        let timeOnly = '';

        try {
            // Intenta crear un objeto Date
            const dateObj = new Date(fullDateText);

            // Verifica si la fecha es válida
            if (!isNaN(dateObj.getTime())) {
                // Si es válida, extrae fecha y hora
                dateOnly = dateObj.toLocaleDateString();
                timeOnly = dateObj.toLocaleTimeString();
            } else {
                // Si no es válida, intenta dividir manualmente
                const parts = fullDateText.split(', ');
                if (parts.length === 2) {
                    dateOnly = parts[0];
                    timeOnly = parts[1];
                } else {
                    // Si falla, usa el texto completo como fecha
                    dateOnly = fullDateText;
                }
            }
        } catch (e) {
            console.error("Error al procesar la fecha:", fullDateText, e);
            // En caso de error, usar el texto original
            dateOnly = fullDateText;
        }

        return {
            Fecha: dateOnly,
            Hora: timeOnly,
            'Nombre del Cliente': order.querySelector('p:nth-child(2)').textContent.replace('Nombre del Cliente: ', ''),
            Vendedor: order.querySelector('p:nth-child(3)').textContent.replace('Vendedor: ', ''),
            Total: order.querySelector('p:nth-child(4)').textContent.replace('Total: $', ''),
            'Método de Pago': order.querySelector('p:nth-child(5)').textContent.replace('Método de pago: ', '')
        };
    });

    // Crear una hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Crear un libro de trabajo y agregar la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de Pedidos');

    // Generar el archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Crear un enlace de descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'historial_pedidos.xlsx';
    link.click();

    // Liberar el objeto URL
    URL.revokeObjectURL(url);
}

// Función para mostrar el modal de registro
function showEmployeeLogModal() {
    document.getElementById('employeeLogModal').style.display = 'block';
}

function closeEmployeeLogModal() {
    document.getElementById('employeeLogModal').style.display = 'none';
}

// Función para registrar acción
function logEmployeeAction(action) {
    const employeeName = document.getElementById('logEmployeeName').value;
    if (!employeeName) {
        alert('Por favor ingrese el nombre del empleado');
        return;
    }

    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';

    fetch('/log-employee', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Local': local
        },
        body: JSON.stringify({ employeeName, action })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Registro de ${action} exitoso para ${employeeName}`);
                document.getElementById('logEmployeeName').value = '';
                closeEmployeeLogModal();
                // Add this line to reload sellers after login/logout
                socket.emit('refresh-sellers');
                // Also update locally
                loadCurrentSellers();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al registrar la acción');
        });
}

// Función para mostrar el historial
function showEmployeeLogHistory() {
    document.getElementById('employeeLogHistoryModal').style.display = 'block';
    loadEmployeeLogs();
}

function closeEmployeeLogHistoryModal() {
    document.getElementById('employeeLogHistoryModal').style.display = 'none';
}

// Función para cargar los logs
function loadEmployeeLogs() {
    const startDate = document.getElementById('logStartDate').value;
    const endDate = document.getElementById('logEndDate').value;
    const employeeName = document.getElementById('logEmployeeFilter').value;

    let url = '/get-employee-logs?';
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    if (employeeName) url += `employeeName=${employeeName}&`;

    fetch(url)
        .then(response => response.json())
        .then(logs => {
            const container = document.getElementById('employeeLogsContainer');
            container.innerHTML = '';

            if (logs.length === 0) {
                container.innerHTML = '<p>No se encontraron registros</p>';
                return;
            }

            logs.forEach(log => {
                const logElement = document.createElement('div');
                logElement.className = `log-entry ${log.action}`;

                const date = new Date(log.timestamp);

                logElement.innerHTML = `
    <div class="log-entry-info">
      <strong>${log.employeeName}</strong> - ${log.action === 'ingreso' ? 'Ingresó' : 'Salió'}
      <div class="log-entry-time">
        ${date.toLocaleDateString()} ${date.toLocaleTimeString()} - ${log.local}
      </div>
    </div>
  `;

                container.appendChild(logElement);
            });
        });
}

// Función para filtrar
function filterEmployeeLogs() {
    loadEmployeeLogs();
}

// Función para descargar Excel
function downloadEmployeeLogsExcel() {
    const startDate = document.getElementById('logStartDate').value;
    const endDate = document.getElementById('logEndDate').value;
    const employeeName = document.getElementById('logEmployeeFilter').value;

    let url = '/get-employee-logs?';
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    if (employeeName) url += `employeeName=${employeeName}&`;

    fetch(url)
        .then(response => response.json())
        .then(logs => {
            // Preparar datos para Excel
            const data = logs.map(log => {
                const date = new Date(log.timestamp);
                return {
                    'Nombre': log.employeeName,
                    'Acción': log.action === 'ingreso' ? 'Ingreso' : 'Egreso',
                    'Fecha': date.toLocaleDateString(),
                    'Hora': date.toLocaleTimeString(),
                    'Local': log.local,
                    'Fecha Completa': log.timestamp
                };
            });

            // Crear hoja de cálculo
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');

            // Generar archivo
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Descargar
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Nombre del archivo con fechas si hay filtro
            let fileName = 'registros_empleados';
            if (startDate || endDate) {
                fileName += `_${startDate || 'inicio'}_${endDate || 'hoy'}`;
            }
            fileName += '.xlsx';

            link.download = fileName;
            link.click();
            URL.revokeObjectURL(url);
        });
}

// Escuchar actualizaciones en tiempo real
socket.on('employee-log-updated', function (newLog) {
    // Si el modal de historial está abierto, actualizar
    if (document.getElementById('employeeLogHistoryModal').style.display === 'block') {
        loadEmployeeLogs();
    }
});

// Función para descargar un cierre específico en Excel
function downloadSingleCashRegister(id) {
    socket.emit('get-single-cash-register', { id: id, forPrint: false });
}

// Escuchar el evento para descargar un cierre específico
socket.on('single-cash-register', (entry) => {
    if (entry) {
        // Crear workbook
        const workbook = XLSX.utils.book_new();
        const data = [];

        // Información básica
        data.push(['INFORME DE CIERRE DE CAJA', '']);
        data.push(['Local:', entry.local]);
        data.push(['Fecha cierre:', new Date(entry.closeTime).toLocaleString()]);
        data.push(['Período:', `${new Date(entry.startTime).toLocaleString()} - ${new Date(entry.closeTime).toLocaleString()}`]);
        data.push(['Total:', `$${entry.paymentSummary.total.toFixed(2)}`]);
        data.push(['']);

        // Métodos de pago
        data.push(['MÉTODOS DE PAGO', '', '']);
        data.push(['Tipo', 'Monto', 'Porcentaje']);
        ['efectivo', 'transferencia', 'mixto'].forEach(method => {
            if (entry.paymentSummary[method] > 0) {
                data.push([
                    method.charAt(0).toUpperCase() + method.slice(1),
                    `$${entry.paymentSummary[method].toFixed(2)}`,
                    `${((entry.paymentSummary[method]/entry.paymentSummary.total)*100).toFixed(2)}%`
                ]);
            }
        });
        data.push(['TOTAL', `$${entry.paymentSummary.total.toFixed(2)}`, '100%']);
        data.push(['']);

        // Productos vendidos
        if (entry.productSummary?.length > 0) {
            data.push(['PRODUCTOS VENDIDOS', '', '', '', '']);
            data.push(['Nombre', 'Precio Unitario', 'Cantidad', 'Stock Inicial', 'Stock Restante', 'Total']);
            entry.productSummary.forEach(p => {
                data.push([
                    p.name,
                    `$${p.price.toFixed(2)}`,
                    p.quantitySold,
                    p.initialStock,
                    p.remainingStock,
                    `$${p.totalSold.toFixed(2)}`
                ]);
            });
            data.push(['']);
        }

        // Pedidos incluidos
        if (entry.orders?.length > 0) {
            data.push(['PEDIDOS INCLUIDOS', '', '', '', '']);
            data.push(['ID', 'Nombre', 'Vendedor', 'Total', 'Método de Pago']);
            entry.orders.forEach(order => {
                data.push([
                    order.id,
                    order.orderName,
                    order.sellerName,
                    `$${order.total.toFixed(2)}`,
                    order.paymentMethod
                ]);
            });
        }

        // Crear hoja de cálculo
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Cierre");

        // Generar archivo
        const dateStr = new Date(entry.closeTime).toISOString().split('T')[0];
        const fileName = `Cierre_${entry.local}_${dateStr}_${entry.id}.xlsx`;

        // Usar Blob para mejor compatibilidad
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Crear y disparar el evento de descarga
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Asegurarnos de que el link esté en el DOM
        link.style.display = 'none';
        document.body.appendChild(link);
        
        link.href = url;
        link.download = fileName;
        
        // Simular clic
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        
        link.dispatchEvent(event);
        
        // Limpiar
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        console.log('Archivo descargado exitosamente:', fileName);
    }
});

// Actualizar la función que muestra el historial
socket.on('update-cash-register-history', (history) => {
    const historyContainer = document.getElementById('cash-register-history');
    historyContainer.innerHTML = '';

    // Ordenar del más reciente al más antiguo
    history.reverse().forEach((entry, index) => {
        const entryElement = document.createElement('div');
        entryElement.className = 'cash-register-entry';

        // Formatear fechas
        const closeTime = new Date(entry.closeTime);
        const startTime = new Date(entry.startTime);
        const formattedCloseTime = closeTime.toLocaleDateString() + ' ' + closeTime.toLocaleTimeString();
        const formattedStartTime = startTime.toLocaleDateString() + ' ' + startTime.toLocaleTimeString();

        // Crear resumen de productos con stock
        let productsHTML = `
<h4>Productos Vendidos (${entry.productSummary.length}):</h4>
<table class="summary-table">
  <tr>
    <th>Producto</th>
    <th>Precio</th>
    <th>Vendidos</th>
    <th>Stock Inicial</th>
    <th>Stock Restante</th>
    <th>Total</th>
  </tr>
`;

        entry.productSummary.forEach(product => {
            productsHTML += `
  <tr>
    <td>${product.name}</td>
    <td>$${product.price.toFixed(2)}</td>
    <td>${product.quantitySold}</td>
    <td>${product.initialStock}</td>
    <td class="${product.remainingStock <= 5 ? 'low-stock' : ''}">${product.remainingStock}</td>
    <td>$${product.totalSold.toFixed(2)}</td>
  </tr>
`;
        });

        productsHTML += '</table>';

        // Crear resumen de pagos detallado
        let paymentsHTML = `
<h4>Métodos de Pago:</h4>
<table class="payment-table">
  <tr>
    <th>Método</th>
    <th>Monto</th>
    <th>% del Total</th>
  </tr>
  <tr>
    <td>Efectivo</td>
    <td>$${entry.paymentSummary.efectivo.toFixed(2)}</td>
    <td>${((entry.paymentSummary.efectivo / entry.paymentSummary.total) * 100).toFixed(1)}%</td>
  </tr>
  <tr>
    <td>Transferencia</td>
    <td>$${entry.paymentSummary.transferencia.toFixed(2)}</td>
    <td>${((entry.paymentSummary.transferencia / entry.paymentSummary.total) * 100).toFixed(1)}%</td>
  </tr>
  <tr>
    <td>Mixto</td>
    <td>$${entry.paymentSummary.mixto.toFixed(2)}</td>
    <td>${((entry.paymentSummary.mixto / entry.paymentSummary.total) * 100).toFixed(1)}%</td>
  </tr>
  <tr class="total-row">
    <td><strong>TOTAL</strong></td>
    <td><strong>$${entry.paymentSummary.total.toFixed(2)}</strong></td>
    <td>100%</td>
  </tr>
</table>
`;

        entryElement.innerHTML = `
<div class="entry-header">
  <h3>Cierre #${history.length - index} - ${formattedCloseTime}</h3>
  <p><strong>Local:</strong> ${entry.local.toUpperCase()}</p>
  <p><strong>Período:</strong> ${formattedStartTime} a ${formattedCloseTime}</p>
  <p><strong>Total Ventas:</strong> $${entry.paymentSummary.total.toFixed(2)}</p>
  <p><strong>Pedidos Procesados:</strong> ${entry.ordersCount}</p>
  <button onclick="downloadSingleCashRegister('${entry.id}')" class="download-btn">Descargar Excel</button>
 <button onclick="printSingleCashRegister('${entry.id}')" class="print-btn">Imprimir</button>
  </div>
<div class="entry-details">
  <button class="toggle-details" onclick="toggleDetails(this)">Mostrar Detalles</button>
  <div class="details-content" style="display:none;">
    ${productsHTML}
    ${paymentsHTML}
    <h4>Pedidos incluidos (${entry.orders.length}):</h4>
  </div>
</div>
<hr>
`;

        historyContainer.appendChild(entryElement);
    });

    // Si no hay resultados, mostrar mensaje
    if (history.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = '<p>No se encontraron cierres de caja en el período especificado.</p>';
        historyContainer.appendChild(noResults);
    }
});

// Agregar esta función
function loadCurrentSellers() {
    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
    
    fetch('/get-sellers')
        .then(response => response.json())
        .then(data => {
            const sellers = data[local];
            if (!sellers) {
                console.warn('No se encontraron vendedores para', local);
                return;
            }

            // Actualizar información de vendedores en la UI
            Object.keys(sellers).forEach(sellerId => {
                const seller = sellers[sellerId];
                if (seller) {
                    const sellerName = typeof seller === 'object' ? seller.name : seller;
                    const button = document.getElementById(sellerId);
                    if (button) {
                        button.textContent = sellerName;
                        button.disabled = false;
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error al cargar vendedores actuales:', error);
        });
}

// Actualizar la función loadCashRegisterHistory para aceptar fechas de filtro
function loadCashRegisterHistory(startDate = '', endDate = '') {
    socket.emit('get-cash-register-history', { startDate, endDate });
};
