// CRUD Operations
function saveProduct() {
    const productId = document.getElementById('editProductId').value;
    const product = {
      name: document.getElementById('name').value,
      category: document.getElementById('category').value,
      price: parseFloat(document.getElementById('price').value),
      stock: parseInt(document.getElementById('stock').value),
      description: document.getElementById('description').value
    };

    const url = productId ?
      `/update-product/local2/${productId}` :
      `/add-product/local2`;

    fetch(url, {
      method: productId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    })
      .then(response => {
        if (!response.ok) throw new Error('Error al guardar el producto');
        return response.json();
      })
      .then(() => {
        resetForm();
        // La actualización de la UI se maneja a través de Socket.IO
      })
      .catch(error => {
        document.getElementById('formError').textContent = error.message;
        document.getElementById('formError').style.display = 'block';
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