const express = require('express');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Resend } = require('resend');

const app = express();
const port = process.env.PORT || 3000;
// Inicializa Resend con tu API key
const resend = new Resend('re_cXNYDWxU_B1bUdnWLoFJDqYh81pqfN2HC');
// Middleware setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
const cashRegisterFilePath = path.join(__dirname, 'cashRegisterHistory.json');
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Agregado para procesar formularios
app.use(session({
  secret: 'empanadaskm11',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const credentials = {
  local1: { user: 'admin1', password: bcrypt.hashSync('password1', 10) },
  local2: { user: 'admin2', password: bcrypt.hashSync('password2', 10) }
};

// Función para leer el inventario
function readInventory() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data', 'inventory.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error al leer el inventario:', error);
    // Retornar un inventario por defecto en caso de error
    return {
      local1: { products: [] },
      local2: { products: [] }
    };
  }
}

function authenticate(req, res, next) {
  const { user, password, local } = req.body;

  console.log('Datos recibidos:', { user, local }); // Para debug

  if (!['local1', 'local2'].includes(local)) {
    return res.status(400).json({ success: false, message: 'Local no válido' });
  }

  if (user === credentials[local].user && bcrypt.compareSync(password, credentials[local].password)) {
    req.session.local = local;
    req.session.user = user;
    next();
  } else {
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }
}

function isAuthenticated(req, res, next) {
  if (req.session.local && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Ruta principal
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  if (req.session.user && req.session.local) {
    res.redirect(`/${req.session.local}`);
  } else {
    res.render('login');
  }
});

app.post('/login', authenticate, (req, res) => {
  res.redirect(`/${req.session.local}`);
});

app.get('/local1', isAuthenticated, (req, res) => {
  const inventory = readInventory(); // Refresh data
  res.render('local1', { products: inventory.local1.products, user: req.session.user });
});

app.get('/local2', isAuthenticated, (req, res) => {
  const inventory = readInventory(); // Refresh data
  res.render('local2', { products: inventory.local2.products, user: req.session.user });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error al cerrar sesión');
    }
    res.redirect('/login');
  });
});

// Declarar el carrito como una variable global
let cart = []; // Aquí declaramos el carrito
let carts = {
  local1: [],
  local2: []
};
// Ruta para el archivo de pedidos
const ordersPath = path.join(__dirname, 'data', 'orders.json');

// Ruta para guardar y recuperar la información de los vendedores
const sellersPath = path.join(__dirname, 'data', 'sellers.json');

// Función para leer los nombres de los vendedores
function readSellers() {
  try {
    return JSON.parse(fs.readFileSync(sellersPath, 'utf8'));
  } catch (error) {
    // Si el archivo no existe o está vacío, devolver un objeto con valores predeterminados
    return {
      local1: { vendedor1: null, vendedor2: null },
      local2: { vendedor1: null, vendedor2: null }
    };
  }
}

function writeSellers(sellers) {
  fs.writeFileSync(sellersPath, JSON.stringify(sellers, null, 2));
}

// Ruta para el historial de cambios de los vendedores
const sellersHistoryPath = path.join(__dirname, 'data', 'sellers_history.json');

// Función para leer el historial de cambios de vendedores
function readSellersHistory() {
  try {
    return JSON.parse(fs.readFileSync(sellersHistoryPath));
  } catch (error) {
    return []; // Si el archivo no existe o está vacío, devolver un array vacío
  }
}

// Función para escribir el historial de cambios de vendedores
function writeSellersHistory(sellersHistory) {
  fs.writeFileSync(sellersHistoryPath, JSON.stringify(sellersHistory, null, 2));
}

// Ruta para actualizar el nombre de un vendedor y guardar el historial
app.post('/update-seller', (req, res) => {
  const { seller, name } = req.body;
  const sellers = readSellers();
  const sellersHistory = readSellersHistory();
  const local = req.headers['x-local']; // Obtener el local desde la cabecera

  if (!['local1', 'local2'].includes(local)) {
    return res.status(400).send('Local no válido');
  }

  // Guardar el cambio en el historial
  sellersHistory.push({
    seller,
    oldName: sellers[local][seller] ? sellers[local][seller].name : null,
    newName: name,
    updatedAt: new Date().toISOString(),
    local // Agregar el local al historial
  });

  // Actualizar el nombre del vendedor
  sellers[local][seller] = {
    name,
    updatedAt: new Date().toISOString()
  };

  writeSellers(sellers);
  writeSellersHistory(sellersHistory);

  io.emit('seller-updated', sellers);
  res.status(200).send('Vendedor actualizado');
});

// Ruta para obtener los nombres de los vendedores
app.get('/get-sellers', (req, res) => {
  const sellers = readSellers();
  res.json(sellers);
});

// Ruta para obtener el historial de cambios de los vendedores
app.get('/get-sellers', (req, res) => {
  const local = req.query.local; // Obtener el local desde la query

  if (!['local1', 'local2'].includes(local)) {
    return res.status(400).send('Local no válido');
  }

  const sellers = readSellers();
  res.json(sellers[local]);
});

// Función para leer pedidos, aceptando un parámetro para el local
function readOrders(local) {
  const ordersFilePath = local === 'local2' ? path.join(__dirname, 'data', 'orders2.json') : ordersPath;
  try {
    return JSON.parse(fs.readFileSync(ordersFilePath));
  } catch (error) {
    return [];
  }
}

// Función para escribir pedidos, aceptando un parámetro para el local
function writeOrders(local, orders) {
  const ordersFilePath = local === 'local2' ? path.join(__dirname, 'data', 'orders2.json') : ordersPath;
  fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));
}


// Read products from JSON file
const productsPath = path.join(__dirname, 'data', 'products.json');

function readInventory() {
  return JSON.parse(fs.readFileSync(productsPath));
}

function writeInventory(inventory) {
  fs.writeFileSync(productsPath, JSON.stringify(inventory, null, 2));
}

let inventory = readInventory();

// Routes for Local 1 and 2
app.get('/local1', (req, res) => {
  inventory = readInventory(); // Refresh data
  res.render('local1', { products: inventory.local1.products });
});

app.get('/local2', (req, res) => {
  inventory = readInventory(); // Refresh data
  res.render('local2', { products: inventory.local2.products });
});

// Ruta para obtener las categorías de productos
app.get('/get-categories/:location', (req, res) => {
  const { location } = req.params;
  const inventory = readInventory();
  const products = inventory[location].products;

  // Obtener categorías únicas
  const categories = [...new Set(products.map(product => product.category))];
  res.json(categories);
});

// CRUD Operations
// Add new product
app.post('/add-product/:location', (req, res) => {
  const { location } = req.params;
  const newProduct = req.body;

  // Generate new ID
  const maxId = Math.max(...inventory[location].products.map(p => p.id), 0);
  newProduct.id = maxId + 1;

  inventory[location].products.push(newProduct);
  writeInventory(inventory);

  io.emit('product-added', { location, product: newProduct });
  res.status(201).json(newProduct);
});

// Update product
app.put('/update-product/:location/:id', (req, res) => {
  const { location, id } = req.params;
  const updatedProduct = req.body;
  const productId = parseInt(id);

  const index = inventory[location].products.findIndex(p => p.id === productId);
  if (index === -1) {
    return res.status(404).send('Producto no encontrado');
  }

  inventory[location].products[index] = { ...updatedProduct, id: productId };
  writeInventory(inventory);

  io.emit('product-updated', { location, product: inventory[location].products[index] });
  res.json(inventory[location].products[index]);
});

// Delete product
app.delete('/delete-product/:location/:id', (req, res) => {
  const { location, id } = req.params;
  const productId = parseInt(id);

  const initialLength = inventory[location].products.length;
  inventory[location].products = inventory[location].products.filter(p => p.id !== productId);

  if (inventory[location].products.length === initialLength) {
    return res.status(404).send('Producto no encontrado');
  }

  writeInventory(inventory);
  io.emit('product-deleted', { location, productId });
  res.status(200).send('Producto eliminado');
});

// Transfer stock between locations
app.post('/transfer-stock', (req, res) => {
  const { productId, quantity, fromLocation, toLocation } = req.body;

  const sourceProduct = inventory[fromLocation].products.find(p => p.id === productId);
  const targetProduct = inventory[toLocation].products.find(p => p.id === productId);

  if (!sourceProduct || !targetProduct) {
    return res.status(404).send('Producto no encontrado');
  }

  const transferQuantity = parseInt(quantity);

  if (sourceProduct.stock < transferQuantity) {
    return res.status(400).send('Stock insuficiente para transferir');
  }

  sourceProduct.stock -= transferQuantity;
  targetProduct.stock += transferQuantity;

  writeInventory(inventory);

  io.emit('stock-update', {
    productId,
    sourceLocation: fromLocation,
    targetLocation: toLocation,
    sourceStock: sourceProduct.stock,
    targetStock: targetProduct.stock
  });

  res.status(200).send('Transferencia completada');
});

// Start server
const server = app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Socket.IO setup
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  // Escucha por actualizaciones de stock
  socket.on('stock-update', ({ local, items }) => {
    // Emite la actualización a todos los clientes
    io.emit('stock-update', { local, items });

    // Verifica si hay algún item con stock bajo
    const lowStockItems = items.filter(item =>
      (item.product && item.product.stock <= 5) ||
      (item.newStock !== undefined && item.newStock <= 5)
    );

    // Si hay items con stock bajo, registra en consola
    if (lowStockItems.length > 0) {
      console.log('Items con stock bajo:', lowStockItems);
    }
  });

  // Escucha por alertas de stock bajo para enviar email
  socket.on('send-alert-to-local2', async (data) => {
    const { productName, stockLevel, localFrom, item } = data;

    try {
      // Envía email usando Resend
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'empanadaskm11.brc@gmail.com', // Reemplaza con el email correcto
        subject: `Alerta de Stock Bajo - ${productName}`,
        html: `
          <h1>⚠️ Alerta de Stock Bajo</h1>
          <p>El producto <strong>${productName}</strong> tiene un stock bajo!.</p>
          <p>Esta alerta fue enviada desde <strong>${localFrom}</strong>.</p>
          <p>Por favor, reabastece este producto lo antes posible.</p>
          <p>Fecha y hora: ${new Date().toLocaleString()}</p>
        `
      });

      if (error) {
        console.error('Error al enviar email:', error);
        socket.emit('alert-email-status', {
          success: false,
          message: 'Error al enviar email de alerta'
        });
      } else {
        console.log('Email de alerta enviado:', data);
        socket.emit('alert-email-status', {
          success: true,
          message: 'Email de alerta enviado correctamente'
        });

        // Notificar a todos los clientes de Local 2
        io.emit('stock-alert-notification', {
          productName,
          stockLevel,
          localFrom,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error en el envío de alerta:', err);
      socket.emit('alert-email-status', {
        success: false,
        message: 'Error interno al procesar la alerta'
      });
    }
  });

  // Manejar alertas
  socket.on('send-alert-to-local2', (alertMessage) => {
    io.emit('receive-alert-from-local1', alertMessage);
  });

  // Manejar el carrito
  socket.on('add-to-cart', ({ local, product }) => {
    // Verificar si el carrito ya existe para ese local
    if (!carts[local]) carts[local] = []; // Inicializar si no existe

    const existingProduct = carts[local].find((item) => item.id === product.id);
    if (existingProduct) {
      existingProduct.quantity += 1; // Incrementar cantidad si ya existe
    } else {
      product.quantity = 1; // Agregar cantidad si es nuevo
      carts[local].push(product);
    }

    io.emit('cart-updated', { local, cart: carts[local] });
  });


  socket.on('increment-product', ({ local, productId }) => {
    const product = carts[local].find((item) => item.id === productId);
    if (product) {
      product.quantity += 1; // Incrementar cantidad
      io.emit('cart-updated', { local, cart: carts[local] });
    }
  });

  // Decrementar la cantidad de un producto en el carrito
  socket.on('decrement-product', ({ local, productId }) => {
    const product = carts[local].find((item) => item.id === productId);
    if (product) {
      if (product.quantity > 1) {
        product.quantity -= 1; // Decrementar cantidad si es mayor que 1
      } else {
        carts[local] = carts[local].filter((item) => item.id !== productId); // Eliminar si la cantidad es 1
      }
      io.emit('cart-updated', { local, cart: carts[local] });
    }
  });

  // Eliminar un producto del carrito
  socket.on('remove-from-cart', ({ local, productId }) => {
    carts[local] = carts[local].filter((item) => item.id !== productId); // Eliminar producto
    io.emit('cart-updated', { local, cart: carts[local] });
  });

  socket.on('process-order', (orderData) => {
    const { local, items, sellerName } = orderData;
  
    // Validación básica de entrada
    if (!orderData || !local || !['local1', 'local2'].includes(local) || !Array.isArray(items) || items.length === 0) {
      return socket.emit('error', 'Datos de pedido inválidos o local no válido');
    }
  
    // Actualizar el stock de los productos vendidos
    items.forEach(item => {
      if (item.details) {
        // Si es una docena, descontar el stock de los productos individuales
        item.details.forEach(detail => {
          const product = inventory[local].products.find(p => p.name === detail.name);
          if (product) {
            product.stock -= detail.quantity;
            if (product.stock < 0) {
              return socket.emit('error', `No hay suficiente stock para el producto ${product.name}`);
            }
          }
        });
      } else {
        // Si no es una docena, descontar el stock del producto directamente
        const product = inventory[local].products.find(p => p.id === item.id);
        if (product) {
          product.stock -= item.quantity;
          if (product.stock < 0) {
            return socket.emit('error', `No hay suficiente stock para el producto ${product.name}`);
          }
        }
      }
    });
  
    // Guardar el inventario actualizado
    writeInventory(inventory);
  
    // Leer los pedidos previos
    const orders = readOrders(local);
    if (!orders) {
      return socket.emit('error', 'Error al leer los pedidos');
    }
  
    // Añadir el nuevo pedido y guardarlo
    orders.push({
      ...orderData,
      sellerName // Incluir el nombre del vendedor en el pedido
    });
    writeOrders(local, orders);
  
    // Limpiar el carrito
    carts[local] = []; // Limpiar el carrito del local correspondiente
  
    // Emitir evento de actualización de stock para todos los clientes
    const stockUpdates = items.map(item => {
      const product = inventory[local].products.find(p => p.id === item.id);
      return {
        id: item.id,
        newStock: product ? product.stock : 0,
        product: product ? { stock: product.stock } : null
      };
    });
  
    // Emitir el evento de actualización del stock
    io.emit('stock-update', { local, items: stockUpdates });
  
    // Emitir evento para limpiar el carrito en el cliente
    io.emit('cart-updated', { local, cart: [] });
  });

  socket.on('add-docena', ({ local, docena }) => {
    // Leer el inventario actual
    const inventory = readInventory();

    // Generar un nuevo ID para la docena
    const maxId = Math.max(...inventory[local].products.map(p => p.id), 0);
    docena.id = maxId + 1;

    // Agregar la nueva docena al inventario
    inventory[local].products.push(docena);

    // Guardar el inventario actualizado
    writeInventory(inventory);

    // Emitir evento para actualizar la interfaz de usuario
    io.emit('product-added', { location: local, product: docena });
  });

  socket.on('get-order-history', ({ local, date }) => {
    let orders = readOrders(local); // Leer solo los pedidos del local correspondiente

    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);

      orders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= startOfDay && orderDate < endOfDay;
      });
    }

    socket.emit('order-history', orders); // Enviar solo los pedidos del local correspondiente
  });


  const cashRegisterHistory = []; // Array para almacenar los cierres de caja

  socket.on('close-cash-register', (closeData) => {
    // Guardar el cierre de caja en el historial
    cashRegisterHistory.push(closeData);

    // Emitir el historial actualizado a todos los clientes
    socket.emit('update-cash-register-history', cashRegisterHistory);
  });

  // Función para leer el archivo JSON
  function readCashRegisterHistory() {
    if (!fs.existsSync(cashRegisterFilePath)) {
      return []; // Si el archivo no existe, retorna un array vacío
    }
    const data = fs.readFileSync(cashRegisterFilePath, 'utf-8');
    return JSON.parse(data);
  }

  // Función para escribir en el archivo JSON
  function writeCashRegisterHistory(data) {
    fs.writeFileSync(cashRegisterFilePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Manejar el evento de cierre de caja
  socket.on('close-cash-register', (closeData) => {
    // Leer el historial actual
    const history = readCashRegisterHistory();

    // Agregar el nuevo cierre de caja
    history.push(closeData);

    // Guardar el historial actualizado
    writeCashRegisterHistory(history);

    // Emitir el historial actualizado a todos los clientes
    socket.emit('update-cash-register-history', history);
  });

  socket.on('get-cash-register-history', () => {
    // Leer el historial desde el archivo JSON
    const history = readCashRegisterHistory();

    // Enviar el historial al cliente que lo solicitó
    socket.emit('update-cash-register-history', history);
  });

  app.post('/clean-old-data', (req, res) => {
    const local = req.headers['x-local']; // Obtener el local desde la cabecera
  
    try {
      // Calcular la fecha límite (5 días atrás)
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  
      // Limpiar orders.json y orders2.json según el local
      const ordersFilePath = path.join(__dirname, 'data', 'orders.json');
      const orders2FilePath = path.join(__dirname, 'data', 'orders2.json');
  
      let orders = JSON.parse(fs.readFileSync(ordersFilePath, 'utf8'));
      let orders2 = JSON.parse(fs.readFileSync(orders2FilePath, 'utf8'));
  
      // Filtrar los pedidos según el local
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= fiveDaysAgo && order.local === local;
      });
  
      const filteredOrders2 = orders2.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= fiveDaysAgo && order.local === local;
      });
  
      // Guardar los pedidos filtrados
      fs.writeFileSync(ordersFilePath, JSON.stringify(filteredOrders, null, 2));
      fs.writeFileSync(orders2FilePath, JSON.stringify(filteredOrders2, null, 2));
  
      // Limpiar sellers_history.json
      const sellersHistoryPath = path.join(__dirname, 'data', 'sellers_history.json');
      let sellersHistory = JSON.parse(fs.readFileSync(sellersHistoryPath, 'utf8'));
  
      const filteredSellersHistory = sellersHistory.filter(entry => {
        const entryDate = new Date(entry.updatedAt);
        return entryDate >= fiveDaysAgo && entry.local === local;
      });
  
      fs.writeFileSync(sellersHistoryPath, JSON.stringify(filteredSellersHistory, null, 2));
  
      // Limpiar cashRegisterHistory.json
      const cashRegisterHistoryPath = path.join(__dirname, 'data', 'cashRegisterHistory.json');
      let cashRegisterHistory = JSON.parse(fs.readFileSync(cashRegisterHistoryPath, 'utf8'));
  
      const filteredCashRegisterHistory = cashRegisterHistory.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= fiveDaysAgo && entry.local === local;
      });
  
      fs.writeFileSync(cashRegisterHistoryPath, JSON.stringify(filteredCashRegisterHistory, null, 2));
  
      res.status(200).json({ success: true, message: 'Datos antiguos eliminados correctamente' });
    } catch (error) {
      console.error('Error al limpiar los datos antiguos:', error);
      res.status(500).json({ success: false, message: 'Error al limpiar los datos antiguos' });
    }
  });

  // Manejar la desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});