// CRUD Operations
function saveProduct() {
    const isCompound = document.getElementById('isCompound').checked;
    const compoundProducts = [];
    
    if (isCompound) {
        const compoundItems = document.querySelectorAll('.compound-product-item');
        compoundItems.forEach(item => {
            const productId = item.querySelector('.compound-product-select').value;
            const quantity = parseInt(item.querySelector('.compound-quantity').value);
            if (productId && quantity > 0) {
                // Obtener el nombre del producto seleccionado
                const productName = item.querySelector('.compound-product-select').options[item.querySelector('.compound-product-select').selectedIndex].textContent;
                // Eliminar el precio del nombre (si existe)
                const name = productName.split(' - ')[0];
                
                compoundProducts.push({
                    productId: parseInt(productId),
                    name: name,
                    quantity: quantity
                });
            }
        });
    }

    const product = {
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        stock: parseInt(document.getElementById('stock').value),
        description: document.getElementById('description').value,
        isCompound: isCompound,
        components: compoundProducts
    };

    const editProductId = document.getElementById('editProductId').value;
    // Get the current location from the URL or session
    const location = window.location.pathname.split('/')[1]; // This assumes the URL is /local1 or /local2
    const url = editProductId ? `/api/product/${editProductId}` : `/add-product/${location}`;
    const method = editProductId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            resetForm();
            loadProducts();
            
            // Sincronizar con local1
            console.log('Enviando producto a local1:', product);
            fetch('/add-product/local1', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(product)
            })
            .then(res => res.json())
            .then(data => console.log('Respuesta de local1:', data))
            .catch(err => console.error('Error sincronizando con local1:', err));
            
            // Sincronizar con local2
            console.log('Enviando producto a local2:', product);
            fetch('/add-product/local2', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(product)
            })
            .then(res => res.json())
            .then(data => console.log('Respuesta de local2:', data))
            .catch(err => console.error('Error sincronizando con local2:', err));
        } else {
            alert('Error al guardar el producto: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al guardar el producto: ' + error.message);
    });
}

function loadProductForEdit(productId) {
    fetch(`/api/product/${productId}`)
        .then(response => response.json())
        .then(product => {
            document.getElementById('editProductId').value = product.id;
            document.getElementById('name').value = product.name;
            document.getElementById('category').value = product.category;
            document.getElementById('price').value = product.price;
            document.getElementById('stock').value = product.stock;
            document.getElementById('description').value = product.description;
            document.getElementById('isCompound').checked = product.isCompound || false;
            
            // Cargar productos componentes si es un producto compuesto
            if (product.isCompound && product.components && product.components.length > 0) {
                const container = document.getElementById('compoundProductsList');
                container.innerHTML = '';
                
                product.components.forEach((component, index) => {
                    const productDiv = document.createElement('div');
                    productDiv.className = 'compound-product-item';
                    
                    productDiv.innerHTML = `
                        <div>
                            <label>Producto ${index + 1}:</label>
                            <select class="compound-product-select" onchange="updateCompoundProductPrice(this)">
                                <option value="">Seleccionar producto</option>
                            </select>
                        </div>
                        <div>
                            <label>Cantidad:</label>
                            <input type="number" class="compound-quantity" min="1" value="${component.quantity}" required>
                        </div>
                        <div>
                            <label>Precio Unitario:</label>
                            <input type="number" class="compound-unit-price" readonly>
                        </div>
                        <button onclick="removeCompoundProduct(this)">×</button>
                    `;
                    
                    container.appendChild(productDiv);
                    
                    // Cargar productos disponibles y seleccionar el componente
                    loadAvailableProducts(productDiv.querySelector('.compound-product-select'));
                    setTimeout(() => {
                        productDiv.querySelector('.compound-product-select').value = component.productId;
                        updateCompoundProductPrice(productDiv.querySelector('.compound-product-select'));
                    }, 100);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar el producto');
        });
}

function editProduct(product) {
    document.getElementById('formTitle').textContent = 'Editar Producto';
    document.getElementById('editProductId').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('category').value = product.category;
    document.getElementById('price').value = product.price;
    document.getElementById('stock').value = product.stock;
    document.getElementById('description').value = product.description;
    document.getElementById('cancelButton').style.display = 'inline';

    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}

function confirmDelete(productId) {
    document.getElementById(`delete-confirm-${productId}`).style.display = 'block';
}

function deleteProduct(productId) {
    fetch(`/delete-product/local2/${productId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al eliminar el producto');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Remove the product from the UI if it exists
            const productElement = document.getElementById(`product-${productId}`);
            if (productElement) {
                productElement.remove();
            }
            
            // Hide confirmation dialog if it exists
            const confirmDialog = document.getElementById(`delete-confirm-${productId}`);
            if (confirmDialog) {
                confirmDialog.style.display = 'none';
            }
            
            // Optional: Show success message
            alert('Producto eliminado exitosamente');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al eliminar el producto');
    });
}

function cancelDelete(productId) {
    document.getElementById(`delete-confirm-${productId}`).style.display = 'none';
}

function cancelEdit() {
    resetForm();
}

function resetForm() {
  document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
  document.getElementById('editProductId').value = '';
  document.getElementById('name').value = '';
  document.getElementById('category').value = '';
  document.getElementById('price').value = '';
  document.getElementById('stock').value = '';
  document.getElementById('description').value = '';
  document.getElementById('isCompound').checked = false;
  document.getElementById('compoundProductsList').innerHTML = '';
  document.getElementById('cancelButton').style.display = 'none';
}

function loadProducts() {
    // Get the current location from the URL
    const location = window.location.pathname.split('/')[1];
    
    fetch(`/api/products?local=${location}`)
        .then(response => response.json())
        .then(products => {
            const productList = document.getElementById('product-list');
            productList.innerHTML = '';
            
            products.forEach(product => {
                const productElement = document.createElement('li');
                productElement.className = 'product-item';
                productElement.id = `product-${product.id}`;
                
                productElement.innerHTML = `
                    <div class="product-detail">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p>Categoría: ${product.category}</p>
                        <p>Stock: <span id="stock-${product.id}">${product.stock}</span></p>
                        <p>Precio: $${product.price}</p>
                    </div>
                    <div class="actions">
                        <button onclick="editProduct(${JSON.stringify(product)})" class="edit-button">Editar</button>
                        <button onclick="confirmDelete(${product.id})" class="delete-button">Eliminar</button>
                        <div class="transfer-form">
                            <label>Transferir a Foodtruck:</label>
                            <input type="number" id="quantity-${product.id}" min="1" max="${product.stock}" value="0">
                            <button onclick="transferStock(${product.id})">Transferir</button>
                            <div id="error-${product.id}" class="error-message"></div>
                        </div>
                    </div>
                    <div id="delete-confirm-${product.id}" class="delete-confirm" style="display: none;">
                        ¿Está seguro de eliminar este producto?
                        <button onclick="deleteProduct(${product.id})">Sí, eliminar</button>
                        <button onclick="cancelDelete(${product.id})">Cancelar</button>
                    </div>
                `;
                
                productList.appendChild(productElement);
            });
        })
        .catch(error => {
            console.error('Error al cargar productos:', error);
            alert('Error al cargar los productos');
        });
}