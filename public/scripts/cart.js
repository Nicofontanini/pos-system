// Verificar si cart ya existe antes de declararlo
if (typeof cart === 'undefined') {
    let cart = [];
}

// Variables globales
window.cart = window.cart || [];

// Función para agregar al carrito
window.addToCart = function(productData) {
    const product = typeof productData === 'string' ? JSON.parse(productData) : productData;
    
    // Verificar si es un producto de descuento
    if (product.category === 'Descuentos' || product.name.toLowerCase().includes('descuento')) {
        const discountPercent = parseFloat(product.price);
        const currentTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        // Round down the discount amount to the nearest hundred
        const exactDiscountAmount = currentTotal * (discountPercent / 100);
        const discountAmount = Math.floor(exactDiscountAmount / 100) * 100;
        
        window.currentDiscount = {
            percent: discountPercent,
            amount: discountAmount,
            name: product.name,
            id: product.id
        };
        
        updateCartUI();
        return;
    }

    // Resto del código existente para productos normales
    const parsedComponents = product.components?.map(comp => 
        typeof comp === 'string' ? JSON.parse(comp) : comp
    ) || [];

    const item = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        isCompound: product.isCompound,
        components: parsedComponents.map(comp => ({
            ...comp,
            quantity: 0
        }))
    };
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push(item);
        // Show components modal if it's a compound product
        if (item.isCompound && item.components && item.components.length > 0) {
            console.log('Showing modal for compound product:', item);
            showComponentsModal(item);
        }
    }
    
    updateCartUI();
    document.getElementById('checkoutButton').disabled = false;
};

// Función para mostrar el modal con los componentes
function showComponentsModal(item) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
        <span class="close">&times;</span>
        <h3>Componentes de ${item.name}</h3>
        <div class="components-list">
            ${item.components.map((comp, index) => `
                <div class="component-item">
                    <span>${comp.name}</span>
                    <div class="quantity-controls">
                        <button onclick="decrementComponent(${index})" ${comp.quantity <= 0 ? 'disabled' : ''}>-</button>
                        <span id="comp-quantity-${index}">0</span>
                        <button onclick="incrementComponent(${index})">+</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <button onclick="confirmComponents(this)">Confirmar</button>
        <button onclick="closeComponentsModal(this)">Cancelar</button>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Guardar referencia temporal de los componentes
    window.tempComponents = [...item.components];
    window.currentItem = item;

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
        modal.remove();
        window.tempComponents = null;
        window.currentItem = null;
    };
}

// Funciones para manipular cantidades de componentes
window.incrementComponent = function(index) {
    if (window.tempComponents && window.tempComponents[index]) {
        window.tempComponents[index].quantity = (window.tempComponents[index].quantity || 0) + 1;
        updateComponentDisplay(index);
    }
};

window.decrementComponent = function(index) {
    if (window.tempComponents && window.tempComponents[index]) {
        const currentQuantity = window.tempComponents[index].quantity || 0;
        if (currentQuantity > 0) {
            window.tempComponents[index].quantity = currentQuantity - 1;
            updateComponentDisplay(index);
        }
    }
};

// Nueva función auxiliar para actualizar la visualización
function updateComponentDisplay(index) {
    const quantityDisplay = document.getElementById(`comp-quantity-${index}`);
    const decrementButton = document.querySelector(`button[onclick="decrementComponent(${index})"]`);
    
    if (quantityDisplay && decrementButton) {
        const quantity = window.tempComponents[index].quantity;
        quantityDisplay.textContent = quantity;
        decrementButton.disabled = quantity <= 0;
    }
}

window.confirmComponents = function(button) {
    if (window.currentItem && window.tempComponents) {
        // Actualizar los componentes con las nuevas cantidades
        window.currentItem.components = window.tempComponents;
        
        // Actualizar la visualización en el carrito
        updateCartUI();
        
        closeComponentsModal(button);
    }
};

// Función para cerrar el modal
function closeComponentsModal(button) {
    const modal = button.closest('.modal');
    if (modal) {
        modal.remove();
    }
}

// Función para actualizar la interfaz del carrito
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    let total = 0;

    cartItemsContainer.innerHTML = '';

    // Mostrar productos normales
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        
        const subtotal = item.price * item.quantity;
        total += subtotal;

        let componentsHtml = '';
        if (item.isCompound && item.components && item.components.length > 0) {
            componentsHtml = `
                <div class="components-detail">
                    <small>Detalles:</small>
                    ${item.components.map(comp => `
                        <div class="component-detail">
                            <small>- ${comp.name} (${comp.quantity * item.quantity})</small>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        itemElement.innerHTML = `
            <div class="cart-item-main">
                <span>${item.name} x ${item.quantity}</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            ${componentsHtml}
            <div class="cart-item-actions">
                <button onclick="incrementItem(${item.id})">+</button>
                <button onclick="decrementItem(${item.id})">-</button>
                <button onclick="removeItem(${item.id})">Eliminar</button>
            </div>
        `;

        cartItemsContainer.appendChild(itemElement);
    });

    // Mostrar descuento si existe
    if (window.currentDiscount) {
        const discountElement = document.createElement('div');
        discountElement.className = 'cart-item';
        discountElement.innerHTML = `
            <div class="cart-item-main">
                <span>${window.currentDiscount.name} (${window.currentDiscount.percent}%)</span>
                <span>-$${window.currentDiscount.amount.toFixed(2)}</span>
            </div>
            <div class="cart-item-actions">
                <button onclick="removeDiscount()">Eliminar</button>
            </div>
        `;
        cartItemsContainer.appendChild(discountElement);
        total -= window.currentDiscount.amount;
    }

    cartTotalElement.textContent = total.toFixed(2);
}

// Agregar función para remover descuento
function removeDiscount() {
    window.currentDiscount = null;
    updateCartUI();
}

// Funciones para manipular items en el carrito
function incrementItem(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += 1;
        updateCartUI();
    }
}

function decrementItem(productId) {
    const item = cart.find(item => item.id === productId);
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        updateCartUI();
    }
}

function removeItem(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index !== -1) {
        cart.splice(index, 1);
        updateCartUI();
        if (cart.length === 0) {
            document.getElementById('checkoutButton').disabled = true;
        }
    }
}

function generateOrderTicket() {
    let ticketContent = `
        <div class="print-details">
            <h3>Orden</h3>
            <div class="order-items">`;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;

        ticketContent += `
            <div class="ticket-item">
                <div class="ticket-item-main">
                    <strong>${item.name}</strong> x ${item.quantity}
                    <span>$${subtotal.toFixed(2)}</span>
                </div>`;

        // Verificar si es un producto compuesto y tiene componentes
        if (item.isCompound && item.components && item.components.length > 0) {
            ticketContent += `
                <div class="ticket-components">
                    <div class="components-title">Detalles del producto:</div>`;
            
            // Iterar sobre cada componente y mostrar sus cantidades actualizadas
            item.components.forEach(comp => {
                const cantidadTotal = comp.quantity * item.quantity;
                ticketContent += `
                    <div class="ticket-component-detail">
                        • ${comp.name}
                        <div class="component-quantity">
                            ${cantidadTotal}
                        </div>
                    </div>`;
            });

            ticketContent += `</div>`;
        }

        ticketContent += '</div>';
    });

    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    ticketContent += `
            </div>
            <div class="ticket-total">
                <strong>Total: $${total.toFixed(2)}</strong>
            </div>
        </div>`;

    return ticketContent;
}
