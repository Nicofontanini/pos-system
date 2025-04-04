// Función para agregar productos al carrito

function addToCart(productId, productName, productPrice) {
    const docenaType = Object.keys(docenas).find(docena => productName.includes(docena));

    if (docenaType) {
      currentDocena = {
        id: productId,
        name: productName,
        price: productPrice,
        type: docenaType,
        config: docenas[docenaType]
      };

      openDocenaModal(currentDocena);
    } else {
      // Si no es una docena, agregar el producto normalmente
      const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
      socket.emit('add-to-cart', {
        local: local,
        product: {
          id: productId,
          name: productName,
          price: productPrice,
          quantity: 1,
          details: null
        }
      });
    }
  }

  // Función para actualizar la interfaz del carrito
  function updateCartUI() {
    const cartItemsElement = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkoutButton');

    cartItemsElement.innerHTML = ''; // Limpiar el carrito antes de actualizar
    let total = 0;

    // Recorrer los productos en el carrito
    cart.forEach((item) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.innerHTML = `
    <p>${item.name} - $${item.price} x ${item.quantity}</p>
    <button onclick="decrementProduct(${item.id})">-</button>
    <span>${item.quantity}</span>
    <button onclick="incrementProduct(${item.id})">+</button>
    <button onclick="removeFromCart(${item.id})">Eliminar</button>
  `;
      cartItemsElement.appendChild(itemElement);
      total += item.price * item.quantity; // Calcular el total
    });

    cartTotalElement.textContent = total.toFixed(2); // Actualizar el total
    checkoutButton.disabled = cart.length === 0; // Habilitar/deshabilitar el botón de compra
  }

     // Función para eliminar un producto del carrito
     function removeFromCart(productId) {
        const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
        socket.emit('remove-from-cart', { local, productId });
      }




      function openDocenaModal(docena) {
        const modal = document.getElementById('docenaModal');
        const title = document.getElementById('docenaModalTitle');
        const selection = document.getElementById('empanadasSelection');
  
        title.textContent = `Seleccionar empanadas para ${docena.name}`;
        selection.innerHTML = '';
  
        if (docena.config.tipo === 'combinada') {
          // Si es una docena combinada, mostrar los grupos
          docena.config.combinaciones.forEach((grupo, grupoIndex) => {
            const grupoDiv = document.createElement('div');
            grupoDiv.className = 'grupo-empanadas';
            grupoDiv.innerHTML = `<h4>${grupo.nombre} (${grupo.cantidad} unidades)</h4>`;
  
            grupo.opciones.forEach((empanada, empanadaIndex) => {
              const empanadaDiv = document.createElement('div');
              empanadaDiv.className = 'empanada-item';
              empanadaDiv.innerHTML = `
            <span>${empanada}</span>
            <div>
              <button onclick="decrementEmpanada(${grupoIndex}, ${empanadaIndex})">-</button>
              <span id="empanada-${grupoIndex}-${empanadaIndex}-quantity">0</span>
              <button onclick="incrementEmpanada(${grupoIndex}, ${empanadaIndex}, ${grupo.cantidad})">+</button>
            </div>
          `;
              grupoDiv.appendChild(empanadaDiv);
            });
  
            selection.appendChild(grupoDiv);
          });
        } else {
          // Si es una docena normal, mostrar todas las empanadas
          docena.config.forEach((empanada, index) => {
            const empanadaDiv = document.createElement('div');
            empanadaDiv.className = 'empanada-item';
            empanadaDiv.innerHTML = `
          <span>${empanada}</span>
          <div>
            <button onclick="decrementEmpanada(0, ${index})">-</button>
            <span id="empanada-0-${index}-quantity">0</span>
            <button onclick="incrementEmpanada(0, ${index}, 12)">+</button>
          </div>
        `;
            selection.appendChild(empanadaDiv);
          });
        }
  
        modal.style.display = 'block';
      }



      function closeDocenaModal() {
        document.getElementById('docenaModal').style.display = 'none';
        currentDocena = null;
      }
  
      function incrementEmpanada(grupoIndex, empanadaIndex, maxQuantity) {
        const quantityElement = document.getElementById(`empanada-${grupoIndex}-${empanadaIndex}-quantity`);
        let quantity = parseInt(quantityElement.textContent);
  
        // Verificar que no se exceda la cantidad máxima permitida
        const totalSelected = getTotalSelectedForGroup(grupoIndex);
        if (totalSelected < maxQuantity) {
          quantity += 1;
          quantityElement.textContent = quantity;
        } else {
          alert(`No puedes seleccionar más de ${maxQuantity} unidades en este grupo.`);
        }
      }
  
      function decrementEmpanada(grupoIndex, empanadaIndex) {
        const quantityElement = document.getElementById(`empanada-${grupoIndex}-${empanadaIndex}-quantity`);
        let quantity = parseInt(quantityElement.textContent);
        if (quantity > 0) {
          quantity -= 1;
          quantityElement.textContent = quantity;
        }
      }
  
      function getTotalSelectedForGroup(grupoIndex) {
        let total = 0;
        const grupoDiv = document.querySelectorAll(`#empanadasSelection .grupo-empanadas`)[grupoIndex];
        if (grupoDiv) {
          const quantityElements = grupoDiv.querySelectorAll('span[id$="-quantity"]');
          quantityElements.forEach(element => {
            total += parseInt(element.textContent);
          });
        }
        return total;
      }
  
      function confirmDocenaSelection() {
        const grupos = [];
        let isValid = true;
  
        if (currentDocena.config.tipo === 'combinada') {
          // Para docenas combinadas, validar cada grupo
          currentDocena.config.combinaciones.forEach((grupo, grupoIndex) => {
            const empanadas = [];
            let totalSelected = 0;
  
            grupo.opciones.forEach((empanada, empanadaIndex) => {
              const quantity = parseInt(document.getElementById(`empanada-${grupoIndex}-${empanadaIndex}-quantity`).textContent);
              if (quantity > 0) {
                empanadas.push({ name: empanada, quantity });
                totalSelected += quantity;
              }
            });
  
            if (totalSelected !== grupo.cantidad) {
              alert(`Debes seleccionar exactamente ${grupo.cantidad} unidades en el grupo "${grupo.nombre}".`);
              isValid = false;
            }
  
            grupos.push({
              grupo: grupo.nombre,
              empanadas: empanadas
            });
          });
        } else {
          // Para docenas normales, validar el total de empanadas
          const empanadas = [];
          let totalSelected = 0;
  
          currentDocena.config.forEach((empanada, index) => {
            const quantity = parseInt(document.getElementById(`empanada-0-${index}-quantity`).textContent);
            if (quantity > 0) {
              empanadas.push({ name: empanada, quantity });
              totalSelected += quantity;
            }
          });
  
          if (totalSelected !== 12) {
            alert('Debes seleccionar exactamente 12 empanadas.');
            isValid = false;
          }
  
          grupos.push({
            grupo: 'Docena',
            empanadas: empanadas
          });
        }
  
        if (isValid) {
          const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
          socket.emit('add-to-cart', {
            local: local,
            product: {
              id: currentDocena.id,
              name: currentDocena.name,
              price: currentDocena.price,
              quantity: 1,
              details: grupos.flatMap(g => g.empanadas),
              gruposDetalle: grupos // Mantener los grupos para mejor visualización
            }
          });
          closeDocenaModal();
        }
      }
  
      function obtenerEmpanadaDeCombinacion(nombreGrupo, opcionesDisponibles, cantidadRequerida) {
        const empanadas = opcionesDisponibles.map(name => ({ name, quantity: 0 }));
        let totalSelected = 0;
  
        // Pedir al usuario que ingrese la cantidad de cada empanada
        while (totalSelected < cantidadRequerida) {
          let message = `Seleccione ${cantidadRequerida} empanadas de "${nombreGrupo}" (seleccionadas: ${totalSelected}/${cantidadRequerida}):\n`;
          empanadas.forEach((empanada, index) => {
            message += `${index + 1}. ${empanada.name}: ${empanada.quantity} unidades\n`;
          });
  
          const input = prompt(message + "\n\nIngrese el número de la empanada y la cantidad (ej: 1 2):");
  
          if (input === null) {
            // Si el usuario cancela, devolver null
            return null;
          }
  
          const [empanadaIndex, quantity] = input.split(" ").map(Number);
          if (
            empanadaIndex >= 1 &&
            empanadaIndex <= empanadas.length &&
            quantity >= 0 &&
            quantity <= cantidadRequerida - totalSelected
          ) {
            empanadas[empanadaIndex - 1].quantity += quantity;
            totalSelected += quantity;
          } else {
            alert(`Entrada inválida. Asegúrese de ingresar un número válido y una cantidad que no exceda las ${cantidadRequerida - totalSelected} unidades restantes.`);
          }
        }
  
        // Filtrar solo las empanadas con cantidad > 0
        return empanadas.filter(empanada => empanada.quantity > 0);
      }
  
      // Función para incrementar la cantidad de un producto
      function incrementProduct(productId) {
        const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
        socket.emit('increment-product', { local, productId });
      }
  
      // Función para decrementar la cantidad de un producto
      function decrementProduct(productId) {
        const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
        socket.emit('decrement-product', { local, productId });
      }

      // Script para manejar el carrito y el pago
    document.addEventListener('DOMContentLoaded', function () {
        // Botón de checkout
        const checkoutButton = document.getElementById('checkoutButton');
        const modal = document.getElementById('paymentModal');
        const closeBtn = modal.querySelector('.close');
        const processPaymentBtn = document.getElementById('processPaymentBtn');
  
        // Event Listeners
        checkoutButton.addEventListener('click', showPaymentModal);
        closeBtn.addEventListener('click', closePaymentModal);
        processPaymentBtn.addEventListener('click', processPayment);
      });
  
      // Socket event listeners
      socket.on('product-added', function (data) {
        if (data.location === 'local1') {
          location.reload();
        }
      });
  
      socket.on('product-updated', function (data) {
        if (data.location === 'local1') {
          location.reload();
        }
      });
  
      socket.on('product-deleted', function (data) {
        if (data.location === 'local1') {
          const element = document.getElementById(`product-${data.productId}`);
          if (element) element.remove();
        }
      });