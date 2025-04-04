// Función para cargar la información de los vendedores
function loadSellerInfo() {
    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';

    fetch('/get-sellers')
      .then(response => response.json())
      .then(data => {
        const sellerInfo = document.getElementById('sellerInfo');
        sellerInfo.innerHTML = `
      <p>Vendedor 1: ${data[local].vendedor1 ? data[local].vendedor1.name : 'No definido'} (Última actualización: ${data[local].vendedor1 ? new Date(data[local].vendedor1.updatedAt).toLocaleString() : 'N/A'})</p>
      <p>Vendedor 2: ${data[local].vendedor2 ? data[local].vendedor2.name : 'No definido'} (Última actualización: ${data[local].vendedor2 ? new Date(data[local].vendedor2.updatedAt).toLocaleString() : 'N/A'})</p>
      <p>Vendedor 3: ${data[local].vendedor3 ? data[local].vendedor3.name : 'No definido'} (Última actualización: ${data[local].vendedor3 ? new Date(data[local].vendedor3.updatedAt).toLocaleString() : 'N/A'})</p>
      <p>Vendedor 4: ${data[local].vendedor4 ? data[local].vendedor4.name : 'No definido'} (Última actualización: ${data[local].vendedor4 ? new Date(data[local].vendedor4.updatedAt).toLocaleString() : 'N/A'})</p>
    `;

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