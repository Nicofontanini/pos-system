// Función para agregar un nuevo producto componente
function addCompoundProduct() {
    console.log('Agregando producto compuesto');
    const container = document.getElementById('compoundProductsList');
    if (!container) {
        console.error('No se encontró el contenedor de productos compuestos');
        return;
    }
    
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
    const selectElement = productDiv.querySelector('.compound-product-select');
    if (!selectElement) {
        console.error('No se encontró el elemento select');
        return;
    }
    
    loadAvailableProducts(selectElement);
}

// Función para cargar productos disponibles en el select
function loadAvailableProducts(selectElement) {
    console.log('Cargando productos disponibles');
    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
    console.log('Local detectado:', local);
    
    fetch(`/api/products?local=${local}`)
        .then(response => {
            console.log('Respuesta del servidor:', response.status);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            console.log('Productos recibidos:', products);
            if (!Array.isArray(products)) {
                throw new Error('Los productos deben ser un array');
            }
            
            // Limpiar opciones existentes
            while (selectElement.firstChild) {
                selectElement.removeChild(selectElement.firstChild);
            }
            
            // Agregar opción vacía
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Seleccionar producto';
            selectElement.appendChild(emptyOption);
            
            // Agregar productos al select
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                // Convertir el precio a número y formatear
                const price = parseFloat(product.price) || 0;
                option.textContent = `${product.name} - $${price.toFixed(2)}`;
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar productos:', error);
            alert('Error al cargar los productos. Por favor, inténtalo de nuevo.');
        });
}

// Función para actualizar el precio unitario cuando se selecciona un producto
function updateCompoundProductPrice(selectElement) {
    console.log('Actualizando precio de producto');
    const productId = selectElement.value;
    if (!productId) {
        console.log('No se seleccionó ningún producto');
        return;
    }
    
    const quantityInput = selectElement.closest('.compound-product-item').querySelector('.compound-quantity');
    const unitPriceInput = selectElement.closest('.compound-product-item').querySelector('.compound-unit-price');
    
    if (!unitPriceInput) {
        console.error('No se encontró el input de precio unitario');
        return;
    }
    
    // Obtener el precio directamente del producto seleccionado
    const selectedProduct = Array.from(selectElement.options)
        .find(option => option.value === productId);
    
    if (selectedProduct) {
        const priceText = selectedProduct.textContent;
        const priceMatch = priceText.match(/\$(\d+(?:\.\d{2})?)/);
        
        if (priceMatch) {
            const price = parseFloat(priceMatch[1]);
            unitPriceInput.value = price.toFixed(2);
            updateTotalPrice();
            return;
        }
    }
    
    console.error('No se pudo obtener el precio del producto');
    alert('Error al obtener el precio del producto. Por favor, inténtalo de nuevo.');
}

// Función para eliminar un producto componente
function removeCompoundProduct(button) {
    console.log('Eliminando producto compuesto');
    const productItem = button.closest('.compound-product-item');
    if (!productItem) {
        console.error('No se encontró el elemento del producto');
        return;
    }
    
    productItem.remove();
    updateTotalPrice();
}

// Función para actualizar el precio total del producto compuesto
function updateTotalPrice() {
    console.log('Actualizando precio total');
    const compoundProducts = document.querySelectorAll('.compound-product-item');
    let totalPrice = 0;
    
    compoundProducts.forEach(product => {
        const quantity = parseInt(product.querySelector('.compound-quantity').value) || 0;
        const unitPrice = parseFloat(product.querySelector('.compound-unit-price').value) || 0;
        totalPrice += quantity * unitPrice;
    });
    
    const priceInput = document.getElementById('price');
    if (priceInput) {
        priceInput.value = totalPrice.toFixed(2);
    } else {
        console.error('No se encontró el input de precio');
    }
}

// Event listener para el checkbox de producto compuesto
document.addEventListener('DOMContentLoaded', function() {
    console.log('Añadiendo event listener al checkbox');
    const isCompoundCheckbox = document.getElementById('isCompound');
    if (!isCompoundCheckbox) {
        console.error('No se encontró el checkbox de producto compuesto');
        return;
    }
    
    isCompoundCheckbox.addEventListener('change', function() {
        const compoundSection = document.getElementById('compoundProductsSection');
        if (!compoundSection) {
            console.error('No se encontró la sección de productos compuestos');
            return;
        }
        compoundSection.style.display = this.checked ? 'block' : 'none';
    });
});

// Inicializar el formulario cuando se muestra
document.addEventListener('DOMContentLoaded', function() {
    console.log('Añadiendo event listener al botón de mostrar formulario');
    const toggleFormButton = document.getElementById('toggleFormButton');
    if (!toggleFormButton) {
        console.error('No se encontró el botón de mostrar formulario');
        return;
    }
    
    toggleFormButton.addEventListener('click', function() {
        const compoundSection = document.getElementById('compoundProductsSection');
        if (!compoundSection) {
            console.error('No se encontró la sección de productos compuestos');
            return;
        }
        compoundSection.style.display = 'none';
        const isCompoundCheckbox = document.getElementById('isCompound');
        if (isCompoundCheckbox) {
            isCompoundCheckbox.checked = false;
        }
    });
});
