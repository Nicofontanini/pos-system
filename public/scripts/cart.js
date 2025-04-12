// Función para agregar productos al carrito
let cart = []; // Array para almacenar los productos del carrito

function addToCart(productId, productName, productPrice) {
  // Verificar si ya existe en el carrito
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: productName,
      price: productPrice,
      quantity: 1
    });
  }
  
  updateCartUI();
  document.getElementById('checkoutButton').disabled = cart.length === 0;
}

// Función para mostrar el modal de edición
function showEditCompoundModal(item) {
    const modal = document.createElement('div');
    modal.className = 'edit-compound-modal';
    
    // Obtener detalles completos de los productos
    fetch('/api/products')
      .then(response => response.json())
      .then(data => {
        const products = data.products;
        
        let modalContent = `
          <div class="modal-content">
            <h3>Editar ${item.name}</h3>
            <div class="compound-components">`;
            
        item.details.forEach(component => {
          const product = products.find(p => p.id === component.productId);
          const productName = product ? product.name : `Producto ${component.productId}`;
          
          modalContent += `
              <div class="component">
                <label>${productName}:</label>
                <div class="quantity-controls">
                    <button class="decrement-btn" data-product-id="${component.productId}">-</button>
                    <span class="quantity-display">${component.quantity}</span>
                    <button class="increment-btn" data-product-id="${component.productId}">+</button>
                </div>
              </div>`;
        });
        
        modalContent += `
            </div>
            <div class="modal-actions">
              <button class="save-btn">Guardar y Agregar al Carrito</button>
              <button class="cancel-btn">Cancelar</button>
            </div>
          </div>`;
        
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // Asegurarse de que los botones existan antes de agregar los listeners
        const saveBtn = modal.querySelector('.save-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        if (saveBtn && cancelBtn) {
            saveBtn.addEventListener('click', () => {
                saveCompoundChanges(item.id, modal, products, item.name, item.price);
            });
            
            cancelBtn.addEventListener('click', () => {
                modal.remove();
            });
        }

        // Agregar listeners para los botones de incremento/decremento
        const decrementBtns = modal.querySelectorAll('.decrement-btn');
        const incrementBtns = modal.querySelectorAll('.increment-btn');
        
        decrementBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                const quantityDisplay = e.target.nextElementSibling;
                let quantity = parseInt(quantityDisplay.textContent);
                
                if (quantity > 0) {
                    quantity--;
                    quantityDisplay.textContent = quantity;
                }
            });
        });

        incrementBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                const quantityDisplay = e.target.previousElementSibling;
                let quantity = parseInt(quantityDisplay.textContent);
                
                quantity++;
                quantityDisplay.textContent = quantity;
            });
        });
      })
      .catch(error => console.error('Error al obtener productos:', error));
}

// Función para guardar los cambios
function saveCompoundChanges(itemId, modal, products, productName, productPrice) {
    const decrementBtns = modal.querySelectorAll('.decrement-btn');
    const newDetails = [];
    
    decrementBtns.forEach((btn, index) => {
        const productId = parseInt(btn.dataset.productId);
        const product = products.find(p => p.id === productId);
        const productName = product ? product.name : `Producto ${productId}`;
        const quantityDisplay = btn.nextElementSibling;
        const quantity = parseInt(quantityDisplay.textContent);
        
        if (quantity > 0) {  
            newDetails.push({
                productId: productId,
                name: productName,
                quantity: quantity
            });
        }
    });
    
    // Create a unique identifier for this product configuration
    const productConfigId = `compound-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to cart
    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
    socket.emit('add-to-cart', {
        local: local,
        product: {
            id: productConfigId,  
            originalId: itemId,   
            name: productName,
            price: productPrice,
            quantity: 1,
            details: newDetails
        }
    });
    
    modal.remove();
}

// Función para actualizar la interfaz del carrito
function updateCartUI() {
  const cartItemsElement = document.getElementById('cart-items');
  const cartTotalElement = document.getElementById('cart-total');
  const checkoutButton = document.getElementById('checkoutButton');

  cartItemsElement.innerHTML = '';
  let total = 0;

  // Recorrer los productos en el carrito
  if (cart && Array.isArray(cart)) {
      cart.forEach((item) => {
          if (!item || typeof item !== 'object') return;
          
          const itemElement = document.createElement('div');
          itemElement.className = 'cart-item';
          itemElement.dataset.productId = item.id; // Guardar el ID como data attribute
          
          // Construir el HTML del producto
          let productDetails = ``;
          if (item.details && Array.isArray(item.details) && item.details.length > 0) {
              productDetails = `<div class="compound-details">
                <h4>Componentes:</h4>
                <ul>`;
              
              item.details.forEach(component => {
                productDetails += `<li>${component.quantity} x ${component.name || 'Producto sin nombre'}</li>`;
              });
              productDetails += `</ul></div>`;
          }
          
          // Ensure price is a number
          const price = typeof item.price === 'number' ? item.price : 0;
          const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
          
          itemElement.innerHTML = `
            <div class="product-info">
              <h3>${item.name || 'Producto sin nombre'}</h3>
              <p>Precio: $${price.toFixed(2)}</p>
              ${productDetails}
            </div>
            <div class="quantity-controls">
              <button class="decrement-btn">-</button>
              <span>${quantity}</span>
              <button class="increment-btn">+</button>
            </div>
            <button class="remove-btn">Eliminar</button>
          `;
          
          cartItemsElement.appendChild(itemElement);
          
          // Agregar event listeners a los botones
          const decrementBtn = itemElement.querySelector('.decrement-btn');
          const incrementBtn = itemElement.querySelector('.increment-btn');
          const removeBtn = itemElement.querySelector('.remove-btn');
          
          decrementBtn.addEventListener('click', function() {
              decrementProduct(item.id);
          });
          
          incrementBtn.addEventListener('click', function() {
              incrementProduct(item.id);
          });
          
          removeBtn.addEventListener('click', function() {
              removeFromCart(item.id);
          });
          
          total += price * quantity;
      });
  }
  
  cartTotalElement.textContent = total.toFixed(2);
  checkoutButton.disabled = cart.length === 0;
}

// Función para eliminar un producto del carrito
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
  document.getElementById('checkoutButton').disabled = cart.length === 0;
}

// Función para procesar la venta
function processSale() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const local = localStorage.getItem('currentLocal') || 'local1';
    
    if (cartItems.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    // Verificar stock disponible de productos
    fetch(`/api/products?local=${local}`)
        .then(response => response.json())
        .then(data => {
            const products = data.products;
            const insufficientStock = cartItems.some(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return true;
                
                // Si es un producto compuesto, verificar stock de componentes
                if (product.isCompound && product.components) {
                    return product.components.some(component => {
                        const componentProduct = products.find(p => p.id === component.productId);
                        return componentProduct && componentProduct.stock < (component.quantity * item.quantity);
                    });
                }
                
                return product.stock < item.quantity;
            });

            if (insufficientStock) {
                alert('No hay suficiente stock para completar la venta');
                return;
            }

            // Preparar datos de la venta
            const sale = {
                items: cartItems,
                total: calculateTotal(),
                date: new Date().toISOString(),
                seller: selectedSeller
            };

            // Enviar la venta al servidor
            fetch(`/api/sale?local=${local}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sale)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Limpiar el carrito
                    localStorage.removeItem('cart');
                    updateCartUI();
                    
                    // Mostrar mensaje de éxito
                    alert('Venta procesada exitosamente');
                    
                    // Actualizar la lista de productos
                    products();
                } else {
                    alert('Error al procesar la venta: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al procesar la venta');
            });
        })
        .catch(error => {
            console.error('Error al verificar stock:', error);
            alert('Error al verificar el stock de productos');
        });
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
              gruposDetalle: grupos 
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

      // Función para mostrar el modal de edición
      function showEditCompoundModal(item) {
        const modal = document.createElement('div');
        modal.className = 'edit-compound-modal';
        
        // Obtener detalles completos de los productos
        fetch('/api/products')
          .then(response => response.json())
          .then(data => {
            const products = data.products;
            
            let modalContent = `
              <div class="modal-content">
                <h3>Editar ${item.name}</h3>
                <div class="compound-components">`;
                
            item.details.forEach(component => {
              const product = products.find(p => p.id === component.productId);
              const productName = product ? product.name : `Producto ${component.productId}`;
              
              modalContent += `
                  <div class="component">
                    <label>${productName}:</label>
                    <div class="quantity-controls">
                        <button class="decrement-btn" data-product-id="${component.productId}">-</button>
                        <span class="quantity-display">${component.quantity}</span>
                        <button class="increment-btn" data-product-id="${component.productId}">+</button>
                    </div>
                  </div>`;
            });
            
            modalContent += `
                </div>
                <div class="modal-actions">
                  <button class="save-btn">Aceptar</button>
                  <button class="cancel-btn">Cancelar</button>
                </div>
              </div>`;
            
            modal.innerHTML = modalContent;
            document.body.appendChild(modal);
            
            // Asegurarse de que los botones existan antes de agregar los listeners
            const saveBtn = modal.querySelector('.save-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');
            
            if (saveBtn && cancelBtn) {
                saveBtn.addEventListener('click', () => {
                    saveCompoundChanges(item.id, modal, products, item.name, item.price);
                });
                
                cancelBtn.addEventListener('click', () => {
                    modal.remove();
                });
            }

            // Agregar listeners para los botones de incremento/decremento
            const decrementBtns = modal.querySelectorAll('.decrement-btn');
            const incrementBtns = modal.querySelectorAll('.increment-btn');
            
            decrementBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productId = parseInt(e.target.dataset.productId);
                    const quantityDisplay = e.target.nextElementSibling;
                    let quantity = parseInt(quantityDisplay.textContent);
                    
                    if (quantity > 0) {
                        quantity--;
                        quantityDisplay.textContent = quantity;
                    }
                });
            });

            incrementBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const productId = parseInt(e.target.dataset.productId);
                    const quantityDisplay = e.target.previousElementSibling;
                    let quantity = parseInt(quantityDisplay.textContent);
                    
                    quantity++;
                    quantityDisplay.textContent = quantity;
                });
            });
          })
          .catch(error => console.error('Error al obtener productos:', error));
      }

      // Función para guardar los cambios
      function saveCompoundChanges(itemId, modal, products, productName, productPrice) {
        const decrementBtns = modal.querySelectorAll('.decrement-btn');
        const newDetails = [];
        
        decrementBtns.forEach((btn, index) => {
            const productId = parseInt(btn.dataset.productId);
            const product = products.find(p => p.id === productId);
            const productName = product ? product.name : `Producto ${productId}`;
            const quantityDisplay = btn.nextElementSibling;
            const quantity = parseInt(quantityDisplay.textContent);
            
            if (quantity > 0) {  
                newDetails.push({
                    productId: productId,
                    name: productName,
                    quantity: quantity
                });
            }
        });
        
        // Create a unique identifier for this product configuration
        const productConfigId = `compound-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Add to cart
        const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
        socket.emit('add-to-cart', {
            local: local,
            product: {
                id: productConfigId,  
                originalId: itemId,   
                name: productName,
                price: productPrice,
                quantity: 1,
                details: newDetails
            }
        });
        
        modal.remove();
      }

      // Función para incrementar la cantidad de un producto
      function incrementProduct(productId) {
        const item = cart.find(item => item.id === productId);
        if (item) {
          item.quantity += 1;
          updateCartUI();
          
          // Actualización via Socket.IO si es necesario
          const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
          socket.emit('increment-product', { local, productId });
        }
      }

      // Función para decrementar la cantidad de un producto
      function decrementProduct(productId) {
        const item = cart.find(item => item.id === productId);
        if (item && item.quantity > 1) {
          item.quantity -= 1;
          updateCartUI();
          
          // Actualización via Socket.IO si es necesario
          const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
          socket.emit('decrement-product', { local, productId });
        }
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

      // Escuchar el evento cart-updated
    socket.on('cart-updated', function ({ local, cart: updatedCart }) {
      // Solo actualizar si el carrito pertenece al local actual
      if (local === (window.location.pathname.includes('local1') ? 'local1' : 'local2')) {
        cart = updatedCart || []; // Initialize with empty array if null
        updateCartUI(); // Update interface
      }
    });
      // Escuchar el evento cart-updated
    socket.on('cart-updated', function ({ local, cart: updatedCart }) {
      // Solo actualizar si el carrito pertenece al local actual
      if (local === (window.location.pathname.includes('local1') ? 'local1' : 'local2')) {
        cart = updatedCart || []; // Initialize with empty array if null
        updateCartUI(); // Update interface
      }
    });