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