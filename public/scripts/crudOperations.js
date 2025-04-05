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
                compoundProducts.push({
                    productId: parseInt(productId),
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
    const url = editProductId ? `/api/product/${editProductId}` : '/api/product';
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
        // La actualización de la UI se maneja a través de Socket.IO
      })
      .catch(error => {
        alert(error.message);
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
    document.getElementById('productForm').reset();
    document.getElementById('cancelButton').style.display = 'none';
    document.getElementById('formError').style.display = 'none';
}