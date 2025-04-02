   // Esta función abre y cierra el dropdown al hacer clic en el botón
   document.querySelector('.dropbtn').addEventListener('click', function () {
    const dropdownContent = document.querySelector('.dropdown-content');
    dropdownContent.style.display = (dropdownContent.style.display === 'block') ? 'none' : 'block';
  });

  // Cerrar el dropdown si el usuario hace clic fuera de él
  window.onclick = function (event) {
    if (!event.target.matches('.dropbtn')) {
      const dropdowns = document.querySelectorAll('.dropdown-content');
      dropdowns.forEach(dropdown => {
        if (dropdown.style.display === 'block') {
          dropdown.style.display = 'none';
        }
      });
    }
  };