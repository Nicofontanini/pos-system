function toggleForm() {
      let form = document.getElementById("productForm");
      let button = document.getElementById("toggleFormButton");

      if (form.classList.contains("show")) {
        form.classList.remove("show");
        setTimeout(() => {
          form.style.display = "none";
        }, 300); // Espera a que termine la animación antes de ocultar
        button.textContent = "Mostrar Formulario";
      } else {
        form.style.display = "block";
        setTimeout(() => {
          form.classList.add("show");
        }, 10); // Pequeño delay para que el fade-in funcione bien
        button.textContent = "Ocultar Formulario";
      }
    }

    // Función para cargar las categorías
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
