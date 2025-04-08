// Import required modules
const express = require('express');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Resend } = require('resend');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize Resend with API key
const resend = new Resend('re_cXNYDWxU_B1bUdnWLoFJDqYh81pqfN2HC');

// Define file paths
const DATA_DIR = path.join(__dirname, 'data');
const productsPath = path.join(DATA_DIR, 'products.json');
const ordersPath = path.join(DATA_DIR, 'orders.json');
const orders2Path = path.join(DATA_DIR, 'orders2.json');
const sellersPath = path.join(DATA_DIR, 'sellers.json');
const sellersHistoryPath = path.join(DATA_DIR, 'sellers_history.json');
const employeeLogsPath = path.join(DATA_DIR, 'employee_logs.json');
const cashRegisterFilePath = path.join(DATA_DIR, 'cashRegisterHistory.json');

// Server state variables
let inventory = null;
let carts = {
  local1: [],
  local2: []
};
let cashRegister = { totalPayments: 0, totalAmount: 0 };
let lastCashRegisterClose = { local1: null, local2: null };

// Authentication credentials
const credentials = {
  local1: { user: 'admin1', password: bcrypt.hashSync('password1', 10) },
  local2: { user: 'admin2', password: bcrypt.hashSync('password2', 10) },
  admin: { user: 'admin', password: bcrypt.hashSync('passworddaniel', 10) }
};

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'empanadaskm11',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// File IO helpers
function readFile(filePath, defaultValue = []) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return defaultValue;
  }
}

function writeFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Data access functions
function readInventory() {
  return readFile(productsPath);
}

function writeInventory(data) {
  writeFile(productsPath, data);
}

function readSellers() {
  return readFile(sellersPath, {
    local1: { vendedor1: null, vendedor2: null },
    local2: { vendedor1: null, vendedor2: null }
  });
}

function writeSellers(data) {
  writeFile(sellersPath, data);
}

function readSellersHistory() {
  return readFile(sellersHistoryPath, []);
}

function writeSellersHistory(data) {
  writeFile(sellersHistoryPath, data);
}

function readOrders(local) {
  const filePath = local === 'local2' ? orders2Path : ordersPath;
  return readFile(filePath, []);
}

function writeOrders(local, orders) {
  const filePath = local === 'local2' ? orders2Path : ordersPath;
  writeFile(filePath, orders);
}

function readEmployeeLogs() {
  return readFile(employeeLogsPath, []);
}

function writeEmployeeLogs(data) {
  writeFile(employeeLogsPath, data);
}

function readCashRegisterHistory() {
  return readFile(cashRegisterFilePath, []);
}

function writeCashRegisterHistory(data) {
  writeFile(cashRegisterFilePath, data);
}

// Authentication middleware
function authenticate(req, res, next) {
  const { user, password, local } = req.body;

  console.log('Datos recibidos:', { user, local });

  if (!['local1', 'local2', 'admin'].includes(local)) {
    return res.status(400).json({ success: false, message: 'Local no válido' });
  }

  const credential = credentials[local];

  if (credential && user === credential.user && bcrypt.compareSync(password, credential.password)) {
    req.session.local = local;
    req.session.user = user;
    next();
  } else {
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }
}

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    // Para el admin, no necesitamos verificar el local
    if (req.session.user === 'admindaniel' || req.session.local === 'admin') {
      return next();
    }
    // Para los otros usuarios, verificamos el local
    if (req.session.local === 'local1' || req.session.local === 'local2') {
      return next();
    }
  }
  res.redirect('/login');
}

// Initialize data
inventory = readInventory();
loadLastCloseTimes();

function loadLastCloseTimes() {
  const history = readCashRegisterHistory();
  history.forEach(entry => {
    if (entry.local && entry.closeTime) {
      lastCashRegisterClose[entry.local] = entry.closeTime;
    }
  });
}

// Authentication routes
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
  const { local } = req.body;

  if (local === 'admin') {
    return res.redirect('/admin');
  } else {
    return res.redirect(`/${local}`);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error al cerrar sesión');
    }
    res.redirect('/login');
  });
});

// Location routes
app.get('/local1', isAuthenticated, (req, res) => {
  inventory = readInventory(); // Refresh data
  res.render('local1', { products: inventory.local1.products, user: req.session.user });
});

app.get('/local2', isAuthenticated, (req, res) => {
  inventory = readInventory(); // Refresh data
  res.render('local2', { products: inventory.local2.products, user: req.session.user });
});

app.get('/admin', isAuthenticated, (req, res) => {
  if (req.session.user !== 'admin') {
    return res.redirect('/login');
  }
  inventory = readInventory(); // Refresh data
  res.render('admin', { products: inventory.local1.products, user: req.session.user });
});

// Category routes
app.get('/get-categories/:location', (req, res) => {
  const { location } = req.params;
  const inventory = readInventory();
  const products = inventory[location].products;

  // Get unique categories
  const categories = [...new Set(products.map(product => product.category))];
  res.json(categories);
});

// Product CRUD operations
app.post('/add-product/:location', (req, res) => {
  const { location } = req.params;
  const newProduct = req.body;

  // Generate new ID
  const maxId = Math.max(...inventory[location].products.map(p => p.id), 0);
  newProduct.id = maxId + 1;

  // Add product to the specified location
  inventory[location].products.push(newProduct);

  // If product is added to local2, also add to local1
  if (location === 'local2') {
    const newProductLocal1 = { ...newProduct };
    inventory.local1.products.push(newProductLocal1);
  }

  // Save updated inventory
  writeInventory(inventory);

  // Emit events to update UI in both locations
  io.emit('product-added', { location, product: newProduct });
  if (location === 'local2') {
    io.emit('product-added', { location: 'local1', product: newProduct });
  }

  res.status(201).json(newProduct);
});

app.put('/update-product/:location/:id', (req, res) => {
  const { location, id } = req.params;
  const updatedProduct = req.body;
  const productId = parseInt(id);

  // Find product in the specified location
  const index = inventory[location].products.findIndex(p => p.id === productId);
  if (index === -1) {
    return res.status(404).send('Producto no encontrado');
  }

  // Update product in the specified location
  inventory[location].products[index] = { ...updatedProduct, id: productId };

  // If product is edited in local2, also update in local1
  if (location === 'local2') {
    const indexLocal1 = inventory.local1.products.findIndex(p => p.id === productId);
    if (indexLocal1 !== -1) {
      inventory.local1.products[indexLocal1] = { ...updatedProduct, id: productId };
    }
  }

  // Save updated inventory
  writeInventory(inventory);

  // Emit events to update UI in both locations
  io.emit('product-updated', { location, product: inventory[location].products[index] });
  if (location === 'local2') {
    io.emit('product-updated', { location: 'local1', product: inventory.local1.products[indexLocal1] });
  }

  res.json(inventory[location].products[index]);
});

app.delete('/delete-product/:location/:id', (req, res) => {
  const { location, id } = req.params;
  const productId = parseInt(id);

  // Delete product from the specified location
  const initialLength = inventory[location].products.length;
  inventory[location].products = inventory[location].products.filter(p => p.id !== productId);

  if (inventory[location].products.length === initialLength) {
    return res.status(404).send('Producto no encontrado');
  }

  // If product is deleted from local2, also delete from local1
  if (location === 'local2') {
    inventory.local1.products = inventory.local1.products.filter(p => p.id !== productId);
  }

  // Save updated inventory
  writeInventory(inventory);

  // Emit events to update UI in both locations
  io.emit('product-deleted', { location, productId });
  if (location === 'local2') {
    io.emit('product-deleted', { location: 'local1', productId });
  }

  res.status(200).send('Producto eliminado');
});

// Stock transfer
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

// Seller management
app.post('/update-seller', (req, res) => {
  const { seller, name } = req.body;
  const sellers = readSellers();
  const sellersHistory = readSellersHistory();
  const local = req.headers['x-local'];

  if (!['local1', 'local2'].includes(local)) {
    return res.status(400).send('Local no válido');
  }

  // Save change to history
  sellersHistory.push({
    seller,
    oldName: sellers[local][seller] ? sellers[local][seller].name : null,
    newName: name,
    updatedAt: new Date().toISOString(),
    local
  });

  // Update seller name
  sellers[local][seller] = {
    name,
    updatedAt: new Date().toISOString()
  };

  writeSellers(sellers);
  writeSellersHistory(sellersHistory);

  io.emit('seller-updated', sellers);
  res.status(200).send('Vendedor actualizado');
});

app.get('/get-sellers', (req, res) => {
  const sellers = readSellers();
  res.json(sellers);
});

app.get('/get-sellers-history', (req, res) => {
  const sellersHistory = readSellersHistory();
  res.json(sellersHistory);
});

// Employee logs
app.post('/log-employee', (req, res) => {
  const { employeeName, action } = req.body;
  const local = req.headers['x-local'] || 'unknown';
  const logs = readEmployeeLogs();

  const newLog = {
    employeeName,
    action,
    timestamp: new Date().toISOString(),
    local
  };

  logs.push(newLog);
  writeEmployeeLogs(logs);

  // Leer el estado actual de los vendedores
  const sellers = readSellers();
  const localSellers = sellers[local];

  if (action === 'ingreso') {
    // Buscar un espacio vacío para el vendedor
    for (let i = 1; i <= 4; i++) {
      const sellerKey = `vendedor${i}`;
      if (!localSellers[sellerKey] || 
          (typeof localSellers[sellerKey] === 'object' && !localSellers[sellerKey].name)) {
        localSellers[sellerKey] = {
          name: employeeName,
          updatedAt: new Date().toISOString()
        };
        writeSellers(sellers);
        io.emit('sellers-updated', sellers);
        break;
      }
    }
  } else if (action === 'egreso') {
    // Buscar y remover al vendedor
    for (let i = 1; i <= 4; i++) {
      const sellerKey = `vendedor${i}`;
      const currentSeller = localSellers[sellerKey];
      if ((typeof currentSeller === 'string' && currentSeller === employeeName) ||
          (typeof currentSeller === 'object' && currentSeller?.name === employeeName)) {
        localSellers[sellerKey] = null;
        writeSellers(sellers);
        io.emit('sellers-updated', sellers);
        break;
      }
    }
  }

  io.emit('employee-log-updated', newLog);
  res.json({ success: true });
});

// Agregar esta nueva ruta para obtener los vendedores actuales
app.get('/get-current-sellers', (req, res) => {
  const sellers = readSellers();
  res.json(sellers);
});

app.get('/get-employee-logs', (req, res) => {
  const { startDate, endDate, employeeName } = req.query;
  let logs = readEmployeeLogs();

  // Filter by date if provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Until end of day

    logs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    });
  }

  // Filter by name if provided
  if (employeeName) {
    logs = logs.filter(log =>
      log.employeeName.toLowerCase().includes(employeeName.toLowerCase())
    );
  }

  res.json(logs);
});

// Cash register
app.get('/cash-register', (req, res) => {
  res.json(cashRegister);
});

app.post('/cash-register', (req, res) => {
  const { totalPayments, totalAmount } = req.body;
  cashRegister.totalPayments = totalPayments;
  cashRegister.totalAmount = totalAmount;
  res.json({ success: true });
});

// Data cleanup
app.post('/clean-old-data', (req, res) => {
  const local = req.headers['x-local'];

  try {
    // Calculate limit date (5 days ago)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Clean orders.json and orders2.json
    let orders = readFile(ordersPath, []);
    let orders2 = readFile(orders2Path, []);

    // Filter orders by location
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= fiveDaysAgo && order.local === local;
    });

    const filteredOrders2 = orders2.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= fiveDaysAgo && order.local === local;
    });

    // Save filtered orders
    writeFile(ordersPath, filteredOrders);
    writeFile(orders2Path, filteredOrders2);

    // Clean sellers_history.json
    let sellersHistory = readFile(sellersHistoryPath, []);

    const filteredSellersHistory = sellersHistory.filter(entry => {
      const entryDate = new Date(entry.updatedAt);
      return entryDate >= fiveDaysAgo && entry.local === local;
    });

    writeFile(sellersHistoryPath, filteredSellersHistory);

    // Clean cashRegisterHistory.json
    let cashRegisterHistory = readFile(cashRegisterFilePath, []);

    const filteredCashRegisterHistory = cashRegisterHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= fiveDaysAgo && entry.local === local;
    });

    writeFile(cashRegisterFilePath, filteredCashRegisterHistory);

    res.status(200).json({ success: true, message: 'Datos antiguos eliminados correctamente' });
  } catch (error) {
    console.error('Error al limpiar los datos antiguos:', error);
    res.status(500).json({ success: false, message: 'Error al limpiar los datos antiguos' });
  }
});

// Ruta para obtener un producto específico
app.get('/api/product/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const local = req.query.local || 'local1';
  const products = inventory[local].products;
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  res.json(product);
});

// Ruta para obtener todos los productos disponibles
app.get('/api/products', (req, res) => {
  const local = req.query.local || 'local1';
  const products = inventory[local].products;
  res.json({ products });
});

// Ruta para agregar un nuevo producto
app.post('/api/product', (req, res) => {   
  try {     
    const newProduct = req.body;

    // Generar un nuevo ID (usando el mayor ID de ambos locales para evitar conflictos)
    const maxIdLocal1 = inventory.local1.products.length > 0 
      ? Math.max(...inventory.local1.products.map(p => p.id)) 
      : 0;
    const maxIdLocal2 = inventory.local2.products.length > 0 
      ? Math.max(...inventory.local2.products.map(p => p.id)) 
      : 0;
    const newId = Math.max(maxIdLocal1, maxIdLocal2) + 1;
    
    newProduct.id = newId;
    
    // Crear una copia para cada local (para evitar referencias compartidas)
    const productForLocal1 = {...newProduct};
    const productForLocal2 = {...newProduct};
    
    // Agregar el producto a ambos locales
    inventory.local1.products.push(productForLocal1);
    inventory.local2.products.push(productForLocal2);
    
    // Guardar los cambios en el archivo
    fs.writeFileSync(productsPath, JSON.stringify(inventory, null, 2));
    
    // Notificar a los clientes a través de socket.io (si estás usando sockets)
    if (io) {
      io.emit('product-added', { location: 'local1', product: productForLocal1 });
      io.emit('product-added', { location: 'local2', product: productForLocal2 });
    }
    
    res.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).json({ success: false, error: 'Error al agregar el producto' });
  }
});

// Ruta para actualizar un producto existente
app.put('/api/product/:id', (req, res) => {
  try {
    const local = req.query.local || 'local1';
    const productId = parseInt(req.params.id);
    const updatedProduct = req.body;
    
    const productIndex = inventory[local].products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
    
    // Actualizar el producto
    inventory[local].products[productIndex] = { ...inventory[local].products[productIndex], ...updatedProduct };
    
    // Guardar los cambios en el archivo
    fs.writeFileSync(productsPath, JSON.stringify(inventory, null, 2));
    
    res.json({ success: true, product: inventory[local].products[productIndex] });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el producto' });
  }
});

// Cash register management
app.post('/close-cash-register', async (req, res) => {
  try {
    const { local } = req.body;

    // 1. Get orders since last close
    const orders = readOrders(local);
    const lastCloseTime = lastCashRegisterClose[local] || new Date(0);

    const newOrders = orders.filter(order =>
      new Date(order.date) > new Date(lastCloseTime) &&
      order.local === local
    );

    // 2. Calculate summary of sold products and remaining stock
    const productSummary = {};
    const inventory = readInventory();

    newOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSummary[item.id]) {
          const product = inventory[local].products.find(p => p.id === item.id);
          productSummary[item.id] = {
            name: item.name,
            price: item.price,
            quantitySold: 0,
            totalSold: 0,
            initialStock: product ? product.stock + item.quantity : 0, // Stock before sale
            remainingStock: product ? product.stock : 0 // Current stock
          };
        }
        productSummary[item.id].quantitySold += item.quantity;
        productSummary[item.id].totalSold += item.price * item.quantity;
      });
    });

    // 3. Calculate summary of payment methods only for this close
    const paymentSummary = {
      efectivo: 0,
      transferencia: 0,
      mixto: 0,
      total: req.body.totalAmount
    };

    newOrders.forEach(order => {
      if (order.paymentMethod === 'mixto') {
        paymentSummary.mixto += order.total;
        paymentSummary.efectivo += order.paymentAmounts?.efectivo || 0;
        paymentSummary.transferencia += order.paymentAmounts?.transferencia || 0;
      } else if (order.paymentMethod === 'efectivo') {
        paymentSummary.efectivo += order.total;
      } else if (order.paymentMethod === 'transferencia') {
        paymentSummary.transferencia += order.total;
      }
    });

    // 4. Create close object with precise information
    const detailedClose = {
      id: generateUniqueID(),
      ...req.body,
      closeTime: new Date().toISOString(),
      startTime: lastCloseTime || newOrders[0]?.date || new Date().toISOString(),
      productSummary: Object.values(productSummary),
      paymentSummary,
      ordersCount: newOrders.length,
      orders: newOrders.map(order => ({
        id: order.id,
        total: order.total,
        paymentMethod: order.paymentMethod,
        orderName: order.orderName,
        sellerName: order.sellerName
      }))
    };

    // 5. Update last close time
    lastCashRegisterClose[local] = detailedClose.closeTime;

    // 6. Save to history
    const history = readCashRegisterHistory();
    history.push(detailedClose);
    writeCashRegisterHistory(history);

    // 7. Emit updated history
    io.emit('update-cash-register-history', history);

    // 8. Reset counters for next close
    cashRegister.totalPayments = 0;
    cashRegister.totalAmount = 0;

    // Emit updated counter status
    io.emit('cash-register-updated', cashRegister);

    // 9. Emit updated history
    io.emit('update-cash-register-history', history);

  } catch (error) {
    console.error('Error en cierre de caja:', error);
  }
});

app.get('/get-cash-register-history', () => {
  // Read history from JSON file
  const history = readCashRegisterHistory();

  // Send history to client that requested it
  io.emit('update-cash-register-history', history);
});

// Función para filtrar el historial por fecha
function filterCashRegisterHistoryByDate(history, startDate, endDate) {
    if (!startDate && !endDate) {
        return history;
    }

    return history.filter(entry => {
        const entryDate = new Date(entry.closeTime);
        
        // Si solo hay fecha inicial
        if (startDate && !endDate) {
            return entryDate >= new Date(startDate);
        }
        
        // Si solo hay fecha final
        if (!startDate && endDate) {
            return entryDate <= new Date(endDate);
        }
        
        // Si hay ambas fechas
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });
}

// Manejar el filtro de historial de cierres
app.post('/filter-cash-register-history', (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const history = readCashRegisterHistory();
        
        const filteredHistory = filterCashRegisterHistoryByDate(history, startDate, endDate);
        
        res.json(filteredHistory);
    } catch (error) {
        console.error('Error al filtrar historial:', error);
        res.json([]);
    }
});

// Start server
const server = app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Socket.IO setup
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  // Listen for cart additions
  socket.on('add-to-cart', (data) => {
    const { local, product } = data;
    
    // Find the cart for this local
    const cart = carts[local] || [];
    
    // Add the product to the cart with quantity 1
    cart.push({
      ...product,
      quantity: 1 // Always add with quantity 1
    });
    
    // Emit the updated cart to all clients in this local
    io.to(local).emit('cart-updated', { local, cart });
  });

  // Listen for cart removals
  socket.on('remove-from-cart', (data) => {
    const { local, productId } = data;
    const cart = carts[local] || [];
    
    // Find the product in the cart
    const productIndex = cart.findIndex(item => item?.id === productId);
    
    if (productIndex !== -1) {
      // Remove the product from the cart
      cart.splice(productIndex, 1);
      
      // Emit the updated cart to all clients in this local
      io.to(local).emit('cart-updated', { local, cart });
    }
  });

  // Listen for quantity increments
  socket.on('increment-product', (data) => {
    const { local, productId } = data;
    const cart = carts[local] || [];
    
    // Find the product in the cart
    const product = cart.find(item => item?.id === productId);
    
    if (product) {
      product.quantity = (product.quantity || 0) + 1;
      // Emit the updated cart to all clients in this local
      io.to(local).emit('cart-updated', { local, cart });
    }
  });

  // Listen for quantity decrements
  socket.on('decrement-product', (data) => {
    const { local, productId } = data;
    const cart = carts[local] || [];
    
    // Find the product in the cart
    const product = cart.find(item => item?.id === productId);
    
    if (product && (product.quantity || 0) > 1) {
      product.quantity = (product.quantity || 0) - 1;
      // Emit the updated cart to all clients in this local
      io.to(local).emit('cart-updated', { local, cart });
    }
  });

  // Listen for stock updates
  socket.on('stock-update', ({ local, items }) => {
    // Emit update to all clients
    io.emit('stock-update', { local, items });

    // Check if any item has low stock
    const lowStockItems = items.filter(item =>
      (item.product && item.product.stock <= 5) ||
      (item.newStock !== undefined && item.newStock <= 5)
    );

    // If there are items with low stock, log to console
    if (lowStockItems.length > 0) {
      console.log('Items con stock bajo:', lowStockItems);
    }
  });

  // Listen for low stock alerts to send email
  socket.on('send-alert-to-local2', async (data) => {
    const { productName, stockLevel, localFrom, item } = data;

    try {
      // Send email using Resend
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'empanadaskm11.brc@gmail.com', // Replace with correct email
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

        // Notify all clients in Local 2
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

  // Handle alerts
  socket.on('send-alert-to-local2', (alertMessage) => {
    io.emit('receive-alert-from-local1', alertMessage);
  });

  // Cart management
  socket.on('add-to-cart', ({ local, product, quantity }) => {
    // Check if cart already exists for that location
    if (!carts[local]) carts[local] = []; // Initialize if it doesn't exist

    const existingProduct = carts[local].find((item) => item.id === product.id && item.configurationId === product.configurationId);
    if (existingProduct) {
      existingProduct.quantity += quantity; // Increment quantity if it already exists
    } else {
      product.quantity = quantity; // Add quantity if it's new
      carts[local].push(product);
    }

    io.emit('cart-updated', { local, cart: carts[local] });
  });

  socket.on('increment-product', ({ local, productId, configurationId }) => {
    const product = carts[local].find((item) => item.id === productId && item.configurationId === configurationId);
    if (product) {
      product.quantity += 1; // Increment quantity
      io.emit('cart-updated', { local, cart: carts[local] });
    }
  });

  socket.on('decrement-product', ({ local, productId, configurationId }) => {
    const product = carts[local].find((item) => item.id === productId && item.configurationId === configurationId);
    if (product) {
      if (product.quantity > 1) {
        product.quantity -= 1; // Decrement quantity if greater than 1
      } else {
        carts[local] = carts[local].filter((item) => item.id !== productId || item.configurationId !== configurationId); // Remove if quantity is 1
      }
      io.emit('cart-updated', { local, cart: carts[local] });
    }
  });

  socket.on('remove-from-cart', ({ local, productId, configurationId }) => {
    carts[local] = carts[local].filter((item) => item.id !== productId || item.configurationId !== configurationId); // Remove product
    io.emit('cart-updated', { local, cart: carts[local] });
  });

  // Order processing
  socket.on('process-order', (orderData) => {
    const { local, items, sellerName } = orderData;

    // Basic input validation
    if (!orderData || !local || !['local1', 'local2'].includes(local) || !Array.isArray(items) || items.length === 0) {
      return socket.emit('error', 'Datos de pedido inválidos o local no válido');
    }

    // Update stock of sold products
    items.forEach(item => {
      if (item.details) {
        // If it's a dozen, subtract stock from individual products
        item.details.forEach(detail => {
          const product = inventory[local].products.find(p => p.name === detail.name);
          if (product) {
            // Si es un producto compuesto, actualizar el stock de sus componentes
            if (product.isCompound && product.components) {
              product.components.forEach(component => {
                const componentQuantity = component.quantity * detail.quantity;
                updateComponentStock(component.productId, componentQuantity, local);
              });
            }
            
            product.stock -= detail.quantity;
            if (product.stock < 0) {
              product.stock = 0;
            }
          }
        });
      } else {
        // If it's not a dozen, subtract stock from the product directly
        const product = inventory[local].products.find(p => p.id === item.id);
        if (product) {
          // Si es un producto compuesto, actualizar el stock de sus componentes
          if (product.isCompound && product.components) {
            product.components.forEach(component => {
              const componentQuantity = component.quantity * item.quantity;
              updateComponentStock(component.productId, componentQuantity, local);
            });
          }
          
          product.stock -= item.quantity;
          if (product.stock < 0) {
            product.stock = 0;
          }
        }
      }
    });

    // Save updated inventory
    writeInventory(inventory);

    // Read previous orders
    const orders = readOrders(local);
    if (!orders) {
      return socket.emit('error', 'Error al leer los pedidos');
    }

    // Add new order and save it
    orders.push({
      ...orderData,
      sellerName // Include seller name in the order
    });
    writeOrders(local, orders);

    // Clear cart
    carts[local] = []; // Clear cart for the corresponding location

    // Emit stock update event for all clients
    const stockUpdates = items.map(item => {
      const product = inventory[local].products.find(p => p.id === item.id);
      return {
        id: item.id,
        newStock: product ? product.stock : 0,
        product: product ? { stock: product.stock } : null
      };
    });

    // Emit stock update event
    io.emit('stock-update', { local, items: stockUpdates });

    // Emit event to clear cart on client
    io.emit('cart-updated', { local, cart: [] });
  });

  // Add dozen
  socket.on('add-docena', ({ local, docena }) => {
    // Read current inventory
    const inventory = readInventory();

    // Generate new ID for dozen
    const maxId = Math.max(...inventory[local].products.map(p => p.id), 0);
    docena.id = maxId + 1;

    // Add new dozen to inventory
    inventory[local].products.push(docena);

    // Save updated inventory
    writeInventory(inventory);

    // Emit event to update UI
    io.emit('product-added', { location: local, product: docena });
  });

  // Order history management
  socket.on('get-order-history-range', ({ local, startDate, endDate }) => {
    let orders = readOrders(local);

    if (startDate && endDate) {
      // Create start date (00:00:00)
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      // Create end date (23:59:59)
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      orders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= start && orderDate <= end;
      });

      console.log('Filtrando por rango de fechas:', startDate, 'hasta', endDate);
      console.log('Órdenes filtradas:', orders.length);
    }

    socket.emit('order-history', orders);
  });

  socket.on('get-order-history', ({ local, date }) => {
    let orders = readOrders(local);

    if (date) {
      orders = orders.filter(order => {
        // Extract only the date part (YYYY-MM-DD)
        const orderDateOnly = order.date.split('T')[0];
        return orderDateOnly === date;
      });
    }

    socket.emit('order-history', orders);
  });

  // Cash register management
  socket.on('close-cash-register', async (closeData) => {
    try {
      const { local } = closeData;

      // 1. Get orders since last close
      const orders = readOrders(local);
      const lastCloseTime = lastCashRegisterClose[local] || new Date(0);

      const newOrders = orders.filter(order =>
        new Date(order.date) > new Date(lastCloseTime) &&
        order.local === local
      );

      // 2. Calculate summary of sold products and remaining stock
      const productSummary = {};
      const inventory = readInventory();

      newOrders.forEach(order => {
        order.items.forEach(item => {
          if (!productSummary[item.id]) {
            const product = inventory[local].products.find(p => p.id === item.id);
            productSummary[item.id] = {
              name: item.name,
              price: item.price,
              quantitySold: 0,
              totalSold: 0,
              initialStock: product ? product.stock + item.quantity : 0, // Stock before sale
              remainingStock: product ? product.stock : 0 // Current stock
            };
          }
          productSummary[item.id].quantitySold += item.quantity;
          productSummary[item.id].totalSold += item.price * item.quantity;
        });
      });

      // 3. Calculate summary of payment methods only for this close
      const paymentSummary = {
        efectivo: 0,
        transferencia: 0,
        mixto: 0,
        total: closeData.totalAmount
      };

      newOrders.forEach(order => {
        if (order.paymentMethod === 'mixto') {
          paymentSummary.mixto += order.total;
          paymentSummary.efectivo += order.paymentAmounts?.efectivo || 0;
          paymentSummary.transferencia += order.paymentAmounts?.transferencia || 0;
        } else if (order.paymentMethod === 'efectivo') {
          paymentSummary.efectivo += order.total;
        } else if (order.paymentMethod === 'transferencia') {
          paymentSummary.transferencia += order.total;
        }
      });

      // 4. Create close object with precise information
      const detailedClose = {
        id: generateUniqueID(),
        ...closeData,
        closeTime: new Date().toISOString(),
        startTime: lastCloseTime || newOrders[0]?.date || new Date().toISOString(),
        productSummary: Object.values(productSummary),
        paymentSummary,
        ordersCount: newOrders.length,
        orders: newOrders.map(order => ({
          id: order.id,
          total: order.total,
          paymentMethod: order.paymentMethod,
          orderName: order.orderName,
          sellerName: order.sellerName
        }))
      };

      // 5. Update last close time
      lastCashRegisterClose[local] = detailedClose.closeTime;

      // 6. Save to history
      const history = readCashRegisterHistory();
      history.push(detailedClose);
      writeCashRegisterHistory(history);

      // 7. Emit updated history
      io.emit('update-cash-register-history', history);

      // 8. Reset counters for next close
      cashRegister.totalPayments = 0;
      cashRegister.totalAmount = 0;

      // Emit updated counter status
      io.emit('cash-register-updated', cashRegister);

      // 9. Emit updated history
      io.emit('update-cash-register-history', history);

    } catch (error) {
      console.error('Error en cierre de caja:', error);
    }
  });

  socket.on('get-cash-register-history', (data) => {
    const { startDate, endDate } = data;
    const history = readCashRegisterHistory();
    const filteredHistory = filterCashRegisterHistoryByDate(history, startDate, endDate);
    socket.emit('update-cash-register-history', filteredHistory);
  });

  // Manejar solicitud de cierre específico
  socket.on('get-single-cash-register', (data) => {
    try {
      const { id } = data;
      const history = readCashRegisterHistory();
      
      // Buscar el cierre por ID
      const entry = history.find(e => e.id === id);
      
      if (entry) {
        socket.emit('single-cash-register', entry);
      } else {
        socket.emit('single-cash-register', null);
      }
    } catch (error) {
      console.error('Error al obtener cierre específico:', error);
      socket.emit('single-cash-register', null);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});