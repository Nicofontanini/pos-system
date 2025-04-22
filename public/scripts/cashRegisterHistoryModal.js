// Elimina cualquier otra función showCashRegisterHistoryModal en otros archivos
function showCashRegisterHistoryModal() {
    console.log('Abriendo modal de historial');
    const modal = document.getElementById('cashRegisterHistoryModal');
    const container = document.getElementById('cash-register-history');
    
    if (!modal || !container) {
        console.error('Modal o contenedor no encontrado');
        return;
    }
    
    console.log('Modal y contenedor encontrados');
    modal.style.display = 'block';
    loadCashRegisterHistory();
}

function loadCashRegisterHistory() {
    console.log('Iniciando carga del historial');
    // Asegúrate de que esta es la única ruta que estás usando
    fetch('/api/cash-register-history')
        .then(response => {
            console.log('Estado de la respuesta:', response.status);
            console.log('Headers:', response.headers);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(history => {
            console.log('Datos recibidos:', history);
            if (Array.isArray(history)) {
                console.log('Número de registros:', history.length);
            } else {
                console.log('Los datos no son un array:', typeof history);
            }
            displayCashRegisterHistory(history);
        })
        .catch(error => {
            console.error('Error en la carga:', error);
            const container = document.getElementById('cash-register-history');
            if (container) {
                container.innerHTML = `<p class="error">Error al cargar: ${error.message}</p>`;
            }
        });
}

function displayCashRegisterHistory(history) {
    const container = document.getElementById('cash-register-history');
    
    if (!history || history.length === 0) {
        container.innerHTML = '<p>No hay registros de cierres de caja</p>';
        return;
    }

    const historyHTML = history.map(entry => {
        console.log('Procesando entrada:', entry); // Debug
        return `
            <div class="history-entry">
                <h3>Cierre de Caja - ${new Date(entry.date).toLocaleDateString()}</h3>
                <p>Local: ${entry.local || 'No especificado'}</p>
                <p>Hora de Inicio: ${entry.startTime ? new Date(entry.startTime).toLocaleTimeString() : 'No disponible'}</p>
                <p>Hora de Cierre: ${entry.closeTime ? new Date(entry.closeTime).toLocaleTimeString() : 'No disponible'}</p>
                <p>Total de Ventas: $${entry.totalAmount || 0}</p>
                <p>Cantidad de Pagos: ${entry.totalPayments || 0}</p>
                <div class="payment-summary">
                    <h4>Resumen de Pagos:</h4>
                    <p>Efectivo: $${entry.paymentSummary?.efectivo || 0}</p>
                    <p>Transferencia: $${entry.paymentSummary?.transferencia || 0}</p>
                    <p>Mixto: $${entry.paymentSummary?.mixto || 0}</p>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = historyHTML;
}

// Add event listeners when the document loads
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('cashRegisterHistoryModal');
    if (modal) {
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
});