// Función para agregar un nuevo producto componente
function addCompoundProduct() {
    const container = document.getElementById('compoundProductsList');
    const productCount = container.children.length;
    
    const productDiv = document.createElement('div');
    productDiv.className = 'compound-product-item';
    
    productDiv.innerHTML = `
        <div>
            <label>Producto ${productCount + 1}:</label>
            <select class="compound-product-select" onchange="updateCompoundProductPrice(this)">
                <option value="">Seleccionar producto</option>
            </select>
        </div>
        <div>
            <label>Cantidad:</label>
            <input type="number" class="compound-quantity" min="1" value="1" required>
        </div>
        <div>
            <label>Precio Unitario:</label>
            <input type="number" class="compound-unit-price" readonly>
        </div>
        <button onclick="removeCompoundProduct(this)">×</button>
    `;
    
    container.appendChild(productDiv);
    
    // Cargar productos disponibles en el select
    loadAvailableProducts(productDiv.querySelector('.compound-product-select'));
}

// Función para cargar productos disponibles en el select
function loadAvailableProducts(selectElement) {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            const products = data.products;
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} - $${product.price}`;
                selectElement.appendChild(option);
            });
        })
        .catch(error => console.error('Error al cargar productos:', error));
}

// Función para actualizar el precio unitario cuando se selecciona un producto
function updateCompoundProductPrice(selectElement) {
    const productId = selectElement.value;
    if (!productId) return;
    
    const quantityInput = selectElement.closest('.compound-product-item').querySelector('.compound-quantity');
    const unitPriceInput = selectElement.closest('.compound-product-item').querySelector('.compound-unit-price');
    
    fetch(`/api/product/${productId}`)
        .then(response => response.json())
        .then(product => {
            unitPriceInput.value = product.price;
            updateTotalPrice();
        })
        .catch(error => console.error('Error al obtener precio:', error));
}

// Función para eliminar un producto componente
function removeCompoundProduct(button) {
    const productItem = button.closest('.compound-product-item');
    productItem.remove();
    updateTotalPrice();
}

// Función para actualizar el precio total del producto compuesto
function updateTotalPrice() {
    const compoundProducts = document.querySelectorAll('.compound-product-item');
    let totalPrice = 0;
    
    compoundProducts.forEach(product => {
        const quantity = parseInt(product.querySelector('.compound-quantity').value) || 0;
        const unitPrice = parseFloat(product.querySelector('.compound-unit-price').value) || 0;
        totalPrice += quantity * unitPrice;
    });
    
    document.getElementById('price').value = totalPrice.toFixed(2);
}

// Event listener para el checkbox de producto compuesto
document.getElementById('isCompound').addEventListener('change', function() {
    const compoundSection = document.getElementById('compoundProductsSection');
    compoundSection.style.display = this.checked ? 'block' : 'none';
});

// Inicializar el formulario cuando se muestra
document.getElementById('toggleFormButton').addEventListener('click', function() {
    const compoundSection = document.getElementById('compoundProductsSection');
    compoundSection.style.display = 'none';
    document.getElementById('isCompound').checked = false;
});
