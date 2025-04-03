function confirmCloseCashRegister() {
    const confirmClose = confirm("¿Estás seguro de que deseas cerrar la caja?");
    if (confirmClose) {
      closeCashRegister(); // Llama a la función existente para cerrar la caja
    } else {
      alert("Cierre de caja cancelado.");
    }
  }