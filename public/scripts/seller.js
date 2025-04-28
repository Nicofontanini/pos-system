// Función para cargar la información de los vendedores
function loadSellerInfo() {
    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';

    fetch('/get-sellers')
      .then(response => response.json())
      .then(data => {
        const sellerInfo = document.getElementById('sellerInfo');
           if (sellerInfo) {
        sellerInfo.innerHTML = `
      <p>Vendedor 1: ${data[local].vendedor1 ? data[local].vendedor1.name : 'No definido'} (Última actualización: ${data[local].vendedor1 ? new Date(data[local].vendedor1.updatedAt).toLocaleString() : 'N/A'})</p>
      <p>Vendedor 2: ${data[local].vendedor2 ? data[local].vendedor2.name : 'No definido'} (Última actualización: ${data[local].vendedor2 ? new Date(data[local].vendedor2.updatedAt).toLocaleString() : 'N/A'})</p>
      <p>Vendedor 3: ${data[local].vendedor3 ? data[local].vendedor3.name : 'No definido'} (Última actualización: ${data[local].vendedor3 ? new Date(data[local].vendedor3.updatedAt).toLocaleString() : 'N/A'})</p>
      <p>Vendedor 4: ${data[local].vendedor4 ? data[local].vendedor4.name : 'No definido'} (Última actualización: ${data[local].vendedor4 ? new Date(data[local].vendedor4.updatedAt).toLocaleString() : 'N/A'})</p>
    `;
 }
        // Actualizar los botones del modal de pago
        for (let i = 1; i <= 4; i++) {
          const seller = data[local][`vendedor${i}`];
          const button = document.getElementById(`seller${i}`);
          if (button && seller) {
            const sellerName = typeof seller === 'object' ? seller.name : seller;
            button.textContent = sellerName;
            button.disabled = false;
          }
        }
      });
  }

  // Función para actualizar el nombre del vendedor
  function updateSeller() {
    const seller = document.getElementById('sellerSelect').value;
    const name = document.getElementById('sellerName').value;

    if (!name) {
      alert('Por favor, ingrese un nombre válido.');
      return;
    }

    fetch('/update-seller', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Local': currentLocal // Enviar el local actual
      },
      body: JSON.stringify({ seller, name })
    })
      .then(response => {
        if (!response.ok) throw new Error('Error al actualizar el vendedor');
        closeSellerModal();
        loadSellerInfo();
        // Actualizar el nombre del vendedor en los botones del modal de pago
        if (seller === 'vendedor1') {
          document.getElementById('seller1Button').textContent = name;
        } else if (seller === 'vendedor2') {
          document.getElementById('seller2Button').textContent = name;
        }
      })
      .catch(error => {
        alert(error.message);
      });
  }

  // Escuchar el evento de actualización de vendedores
  socket.on('seller-updated', function (sellers) {
    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
    const sellerInfo = document.getElementById('sellerInfo');
    sellerInfo.innerHTML = `
  <p>Vendedor 1: ${sellers[local].vendedor1 ? sellers[local].vendedor1.name : 'No definido'} (Última actualización: ${sellers[local].vendedor1 ? new Date(sellers[local].vendedor1.updatedAt).toLocaleString() : 'N/A'})</p>
  <p>Vendedor 2: ${sellers[local].vendedor2 ? sellers[local].vendedor2.name : 'No definido'} (Última actualización: ${sellers[local].vendedor2 ? new Date(sellers[local].vendedor2.updatedAt).toLocaleString() : 'N/A'})</p>
`;

    // Actualizar los botones del modal de pago
    if (sellers[local].vendedor1) {
      document.getElementById('seller1Button').textContent = sellers[local].vendedor1.name;
    }
    if (sellers[local].vendedor2) {
      document.getElementById('seller2Button').textContent = sellers[local].vendedor2.name;
    }
  });
  // Función para seleccionar el vendedor
  function selectSeller(seller) {
    selectedSeller = seller;
    // alert(`Vendedor seleccionado: ${selectedSeller}`);
  }

  // Función para actualizar el nombre del pedido
  function updateOrderName() {
    orderName = document.getElementById('orderName').value;
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

  // Escuchar actualizaciones en tiempo real
  socket.on('employee-log-updated', function (newLog) {
    // Si el modal de historial está abierto, actualizar
    if (document.getElementById('employeeLogHistoryModal').style.display === 'block') {
      loadEmployeeLogs();
    }
  });

  // Agregar esto junto a los otros manejadores de socket
  // Mantener solo un listener para 'sellers-updated'
  socket.on('sellers-updated', (sellers) => {
      const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
      const localSellers = sellers[local];
  
      // Actualizar los botones de vendedor
      for (let i = 1; i <= 4; i++) {
          const button = document.getElementById(`seller${i}`);
          if (button) {
              const seller = localSellers[`vendedor${i}`];
              const sellerName = seller ? (typeof seller === 'object' ? seller.name : seller) : 'Vacío';
              button.textContent = sellerName;
              button.disabled = sellerName === 'Vacío';
          }
      }
  
      // Actualizar también la información en el modal si existe
      const sellerInfo = document.getElementById('sellerInfo');
      if (sellerInfo) {
          loadSellerInfo();
      }
  });

  // Modificar logEmployeeAction para emitir el evento de actualización
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
          body: JSON.stringify({ 
              employeeName, 
              action,
              updateSellers: true // Añadimos este flag
          })
      })
          .then(response => response.json())
          .then(data => {
              if (data.success) {
                  alert(`Registro de ${action} exitoso para ${employeeName}`);
                  document.getElementById('logEmployeeName').value = '';
                  closeEmployeeLogModal();
                  
                  // Actualizar los botones de vendedor
                  updateSellerButtons(employeeName, action);
              }
          })
          .catch(error => {
              console.error('Error:', error);
              alert('Error al registrar la acción');
          });  }

      function updateSellerButtons(employeeName, action) {
          const buttons = document.querySelectorAll('[id^="seller"]');
          
          if (action === 'ingreso') {
              // Buscar el primer botón vacío y asignar el empleado
              for (let button of buttons) {
                  if (button.textContent === 'Vacío') {
                      button.textContent = employeeName;
                      button.disabled = false;
                      // Guardar en localStorage
                      localStorage.setItem(button.id, employeeName);
                      break;
                  }
              }
          } else if (action === 'egreso') {
              // Buscar el botón con el nombre del empleado y vaciarlo
              for (let button of buttons) {
                  if (button.textContent === employeeName) {
                      button.textContent = 'Vacío';
                      button.disabled = true;
                      // Eliminar del localStorage
                      localStorage.removeItem(button.id);
                      break;
                  }
              }
          }
      }

      // Agregar esta nueva función para cargar los vendedores al iniciar
      function loadSellersFromStorage() {
          const buttons = document.querySelectorAll('[id^="seller"]');
          buttons.forEach(button => {
              const sellerName = localStorage.getItem(button.id);
              if (sellerName) {
                  button.textContent = sellerName;
                  button.disabled = false;
              }
          });
      }

      // Llamar a esta función cuando se carga la página
      document.addEventListener('DOMContentLoaded', loadSellersFromStorage);
