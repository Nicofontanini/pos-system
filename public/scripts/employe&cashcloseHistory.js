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
        <style>
          body { font-family: Arial; }
          .order-card { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
        </style>
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
            // Solicitar el historial de cierres de caja al servidor
            socket.emit('get-cash-register-history');
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
        </div>
        <div class="entry-details">
          <button class="toggle-details" onclick="toggleDetails(this)">Mostrar Detalles</button>
          <div class="details-content" style="display:none;">
            ${productsHTML}
            ${paymentsHTML}
            <h4>Pedidos incluidos (${entry.orders.length}):</h4>
            <table class="orders-table">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Vendedor</th>
                <th>Total</th>
                <th>Método</th>
              </tr>
              ${entry.orders.map(order => `
                <tr>
                  <td>${order.id}</td>
                  <td>${order.orderName || 'Sin nombre'}</td>
                  <td>${order.sellerName || 'Sin vendedor'}</td>
                  <td>$${order.total.toFixed(2)}</td>
                  <td>${order.paymentMethod}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </div>
        <hr>
      `;

                historyContainer.appendChild(entryElement);
            });
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
        function printCashRegisterHistory() {
            const historyContent = document.getElementById('cash-register-history').innerHTML;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 5px 0; }
          th, td { border: 1px solid #ddd; padding: 1px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
          .payment-info { margin-top: 20px; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h2>Historial de Cierres de Caja</h2>
        ${historyContent}
      </body>
      </html>
    `);
            printWindow.document.close();
            printWindow.print();
        }

        document.addEventListener('DOMContentLoaded', function () {
            loadSellerInfo();
        });

        function downloadCashRegisterExcel() {
            const historyContainer = document.getElementById('cash-register-history');
            const entries = Array.from(historyContainer.querySelectorAll('.cash-register-entry'));

            const data = entries.map(entry => {
                const entryText = entry.textContent;
                const date = entry.querySelector('.entry-header h3').textContent.split(' - ')[1].trim();
                const local = entry.querySelector('.entry-header p:nth-child(2)').textContent.replace('Local: ', '').trim();
                const total = entry.querySelector('.entry-header p:nth-child(3)').textContent.replace('Total Ventas: $', '').trim();
                const ordersCount = entry.querySelector('.entry-header p:nth-child(4)').textContent.replace('Pedidos Procesados: ', '').trim();

                // Obtener detalles de productos si están visibles
                let productsInfo = '';
                const productsTable = entry.querySelector('.summary-table');
                if (productsTable) {
                    const rows = Array.from(productsTable.querySelectorAll('tr'));
                    productsInfo = rows.slice(1).map(row => {
                        const cells = Array.from(row.querySelectorAll('td'));
                        return `${cells[0].textContent}: ${cells[2].textContent} x $${cells[1].textContent} = $${cells[3].textContent}`;
                    }).join('; ');
                }

                return {
                    'Cierre': entry.querySelector('.entry-header h3').textContent.split(' - ')[0].trim(),
                    'Fecha': date,
                    'Local': local,
                    'Total Ventas': total,
                    'Pedidos Procesados': ordersCount,
                    'Productos Vendidos': productsInfo
                };
            });

            // Crear hoja de cálculo
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Cierres de Caja');

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
                    'Nombre del Pedido': order.querySelector('p:nth-child(2)').textContent.replace('Nombre del pedido: ', ''),
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