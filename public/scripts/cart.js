// Función para agregar productos al carrito
// Verificar si cart ya existe antes de declararlo
if (typeof cart === 'undefined') {
    let cart = [];
}

// Variables globales
window.cart = window.cart || [];

// Función para agregar al carrito
window.addToCart = function(productId, productName, productPrice) {
    const item = {
        id: productId,
        name: productName,
        price: productPrice,
        quantity: 1
    };
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push(item);
    }
    
    updateCartUI();
    document.getElementById('checkoutButton').disabled = false;
};

// Función para actualizar la interfaz del carrito
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    let total = 0;

    cartItemsContainer.innerHTML = '';

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        
        const subtotal = item.price * item.quantity;
        total += subtotal;

        itemElement.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <span>$${subtotal.toFixed(2)}</span>
            <div class="cart-item-actions">
                <button onclick="incrementItem(${item.id})">+</button>
                <button onclick="decrementItem(${item.id})">-</button>
                <button onclick="removeItem(${item.id})">×</button>
            </div>
        `;

        cartItemsContainer.appendChild(itemElement);
    });

    cartTotalElement.textContent = total.toFixed(2);
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