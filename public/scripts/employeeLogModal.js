 // Función para mostrar el modal de registro
 function showEmployeeLogModal() {
    document.getElementById('employeeLogModal').style.display = 'block';
  }

  function closeEmployeeLogModal() {
    document.getElementById('employeeLogModal').style.display = 'none';
  }

// Función para manejar el ingreso/egreso de empleados
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
            // Emitir evento de socket para actualizar vendedores
            window.socket.emit('refresh-sellers');
            // Actualizar vendedores localmente
            if (typeof updateSellerButtons === 'function') {
                updateSellerButtons(employeeName, action);
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al registrar la acción');
    });
}
