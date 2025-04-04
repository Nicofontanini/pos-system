// Función para filtrar productos por categoría
function filterProductsByCategory() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    const productList = document.getElementById('product-list');
    const products = productList.querySelectorAll('.product-item');

    products.forEach(product => {
      const productCategory = product.querySelector('p:nth-child(3)').textContent.replace('Categoría: ', '').trim();
      if (selectedCategory === 'Todas' || productCategory === selectedCategory) {
        product.style.display = 'block'; // Mostrar el producto
      } else {
        product.style.display = 'none'; // Ocultar el producto
      }
    });
  }

  function loadCategories() {
    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
    fetch(`/get-categories/${local}`)
      .then(response => response.json())
      .then(categories => {
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = '<option value="Todas">Todas las Categorías</option>';

        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category;
          option.textContent = category;
          categoryFilter.appendChild(option);
        });
      })
      .catch(error => console.error('Error al cargar las categorías:', error));
  }

  // Llamar a la función cuando la página cargue
  document.addEventListener('DOMContentLoaded', loadCategories);