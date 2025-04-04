function toggleDocenaForm() {
    const form = document.getElementById('docenaForm');
    if (form.style.display === 'none' || !form.style.display) {
      form.style.display = 'block';
      loadEmpanadasForDocena(); // Cargar las empanadas disponibles
    } else {
      form.style.display = 'none';
    }
  }

  function loadEmpanadasForDocena() {
    const empanadasSelection = document.getElementById('empanadasSelection');
    empanadasSelection.innerHTML = ''; // Limpiar el contenedor

    // Obtener las empanadas disponibles (puedes obtenerlas desde tu inventario)
    const empanadas = [
      "Carne", "Pollo", "Verdura", "Cebolla", "Jamon", "Calabaza",
      "Carne Picante", "Choclo", "Salchicha Alemana", "Capresse",
      "Roquefort", "Vacio Provolone", "Chesse Burger", "Cordero",
      "Trucha", "Ciervo"
    ];

    // Generar las opciones de empanadas
    empanadas.forEach((empanada, index) => {
      const empanadaDiv = document.createElement('div');
      empanadaDiv.innerHTML = `
    <label>${empanada}:</label>
    <input type="number" id="empanada-${index}" min="0" value="0">
  `;
      empanadasSelection.appendChild(empanadaDiv);
    });
  }

  function saveDocena() {
    const docenaName = document.getElementById('docenaName').value;
    const docenaPrice = parseFloat(document.getElementById('docenaPrice').value);
    const docenaStock = parseInt(document.getElementById('docenaStock').value);
    const docenaDescription = document.getElementById('docenaDescription').value;

    // Obtener las cantidades de cada empanada
    const empanadasSelection = document.getElementById('empanadasSelection');
    const empanadasInputs = empanadasSelection.querySelectorAll('input[type="number"]');
    const empanadasDetails = [];

    empanadasInputs.forEach((input, index) => {
      const quantity = parseInt(input.value);
      if (quantity > 0) {
        empanadasDetails.push({
          name: input.previousElementSibling.textContent.replace(':', '').trim(),
          quantity: quantity
        });
      }
    });

    // Validar que se hayan seleccionado empanadas
    if (empanadasDetails.length === 0) {
      document.getElementById('docenaFormError').textContent = 'Debes seleccionar al menos una empanada.';
      document.getElementById('docenaFormError').style.display = 'block';
      return;
    }

    // Crear el objeto de la nueva docena
    const newDocena = {
      name: docenaName,
      category: "Docena",
      price: docenaPrice,
      stock: docenaStock,
      description: docenaDescription,
      details: empanadasDetails
    };

    // Enviar la nueva docena al servidor (usando Socket.IO o fetch)
    const local = window.location.pathname.includes('local1') ? 'local1' : 'local2';
    socket.emit('add-docena', { local, docena: newDocena });

    // Limpiar el formulario
    cancelDocena();
    alert('Docena agregada correctamente.');
  }

  function cancelDocena() {
    document.getElementById('docenaForm').reset();
    document.getElementById('docenaFormError').style.display = 'none';
  }

  const docenas = {
    "Docena Tradicionales": ["Carne", "Pollo", "Verdura", "Cebolla", "Jamon", "Calabaza", "Picante", "Choclo", "Salchicha Alemana", "Capresse"],
    "Docena Especiales": ["4 Quesos", "Crudo", "Vegana", "Panceta y Ciruela", "J Roque"],
    "Docena Vacio": ["Vacio Provolone", "Chesse Burger"],
    "Docena Imperdibles": ["Cordero", "Trucha", "Ciervo"],
    "Docena Combinada 1": {
      tipo: "combinada",
      combinaciones: [
        { nombre: "Tradicionales", cantidad: 3, opciones: ["Carne", "Pollo", "Verdura", "Cebolla", "Jamon", "Calabaza", "Picante", "Choclo", "Salchicha Alemana", "Capresse"] },
        { nombre: "Especiales", cantidad: 3, opciones: ["4 Quesos", "Crudo", "Vegana", "Panceta y Ciruela", "J Roque"] },
        { nombre: "Vacio", cantidad: 3, opciones: ["Vacio Provolone", "Chesse Burger"] },
        { nombre: "Imperdibles", cantidad: 3, opciones: ["Cordero", "Trucha", "Ciervo"] }
      ]
    },
    "Docena Combinada 2": {
      tipo: "combinada",
      combinaciones: [
        { nombre: "Tradicionales", cantidad: 4, opciones: ["Carne", "Pollo", "Verdura", "Cebolla", "Jamon", "Calabaza", "Picante", "Choclo", "Salchicha Alemana", "Capresse"] },
        { nombre: "Especiales", cantidad: 4, opciones: ["4 Quesos", "Crudo", "Vegana", "Panceta y Ciruela", "J Roque"] },
        { nombre: "Imperdibles", cantidad: 4, opciones: ["Cordero", "Trucha", "Ciervo"] }
      ]
    },
  };