// Import required modules
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const bcrypt = require('bcrypt');
const { Resend } = require('resend');
const dotenv = require('dotenv');
const sequelize = require('./config/config');
const db = require('./models');
const Product = db.Product;

// Import controllers
const productController = require('./controllers/productController');
const cashRegisterHistoryController = require('./controllers/cashRegisterHistoryController');
const sellersController = require('./controllers/sellersController');
const employeeLogsController = require('./controllers/employeeLogsController');
const orderLocal1Controller = require('./controllers/orderLocal1Controller');
const orderLocal2Controller = require('./controllers/orderLocal2Controller');
const sellersHistoryController = require('./controllers/sellersHistoryController');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize Resend with API key
const resend = new Resend('re_cXNYDWxU_B1bUdnWLoFJDqYh81pqfN2HC');

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'empanadaskm11',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
  // Para producción, considera usar un store como connect-pg-simple
  // store: new (require('connect-pg-simple')(session))()
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
db.sequelize.authenticate()
  .then(() => {
    console.log('Conexión a DB establecida');
    return db.sequelize.sync({ force: false });
  })
  .then(() => {
    console.log('Base de datos sincronizada');
    loadLastCloseTimes();

    // Setup controllers
    app.get('/api/products', (req, res) => {
      // No necesitamos autenticación para obtener productos
      productController.getProducts(req, res);
    });
    app.post('/api/products', isAuthenticated, productController.createProduct);
    app.put('/api/product/:id', isAuthenticated, productController.updateProduct);
    app.get('/api/product/:id', isAuthenticated, productController.getProductById);

    app.get('/api/orders/local1', orderLocal1Controller.getOrders);
    app.post('/api/orders/local1', orderLocal1Controller.createOrder);
    app.put('/api/orders/local1/:id', orderLocal1Controller.updateOrder);
    app.delete('/api/orders/local1/:id', orderLocal1Controller.deleteOrder);
    app.post('/api/orders/local1/filter', orderLocal1Controller.filterOrdersByDate);

    app.get('/api/orders/local2', orderLocal2Controller.getOrders);
    app.post('/api/orders/local2', orderLocal2Controller.createOrder);
    app.put('/api/orders/local2/:id', orderLocal2Controller.updateOrder);
    app.delete('/api/orders/local2/:id', orderLocal2Controller.deleteOrder);
    app.post('/api/orders/local2/filter', orderLocal2Controller.filterOrdersByDate);

    app.get('/api/cash-register-history', cashRegisterHistoryController.getCashRegisterHistory);
    app.post('/api/cash-register-history/filter', cashRegisterHistoryController.getCashRegisterHistoryByDate);
    app.post('/api/cash-register-history', cashRegisterHistoryController.addCashRegisterEntry);
    app.put('/api/cash-register-history/:id', cashRegisterHistoryController.updateCashRegisterEntry);
    app.delete('/api/cash-register-history/:id', cashRegisterHistoryController.deleteCashRegisterEntry);

    app.get('/api/sellers', sellersController.getAllSellers);
    app.get('/api/sellers/:id', sellersController.getSellerById);
    app.post('/api/sellers', sellersController.createSeller);
    app.put('/api/sellers/:id', sellersController.updateSeller);
    app.delete('/api/sellers/:id', sellersController.deleteSeller);

    app.get('/api/sellers-history', sellersHistoryController.getSellersHistory);
    app.get('/api/sellers-history/:sellerId', sellersHistoryController.getSellerHistory);
    app.post('/api/sellers-history/filter', sellersHistoryController.filterSellersHistory);
    app.post('/api/sellers-history', sellersHistoryController.addSellerHistoryEntry);
    app.put('/api/sellers-history/:entryId', sellersHistoryController.updateSellerHistoryEntry);
    app.delete('/api/sellers-history/:entryId', sellersHistoryController.deleteSellerHistoryEntry);

    app.get('/api/sellers/:id/history', sellersController.getSellerHistory);
    app.post('/api/sellers/login', sellersController.recordLogin);
    app.post('/api/sellers/logout', sellersController.recordLogout);

    app.get('/api/employee-logs', employeeLogsController.getEmployeeLogs);
    app.post('/api/employee-logs/filter', employeeLogsController.getEmployeeLogsByDate);
    app.get('/api/employee-logs/employee/:employeeId', employeeLogsController.getEmployeeLogsByEmployee);
    app.post('/api/employee-logs', employeeLogsController.logEmployeeAction);
    app.delete('/api/employee-logs/clean-old', employeeLogsController.deleteEmployeeLogs);

    // Start server
    // Primero inicializa el servidor HTTP y Socket.IO
    const server = app.listen(port, () => {
      console.log(`Servidor iniciado en el puerto ${port}`);
    });

    const io = require('socket.io')(server);

    // Hacer io accesible globalmente
    global.io = io;

    // Luego maneja las conexiones de socket
    io.on('connection', (socket) => {
      console.log('Nuevo cliente conectado');

      // Aquí va el evento refresh-sellers
      // Inside io.on('connection') handler
      socket.on('refresh-sellers', async () => {
        try {
          // Get all active employees (those who have logged in but not out)
          const activeEmployees = await db.EmployeeLog.findAll({
            where: {
              action: 'ingreso',
              id: {
                [db.Sequelize.Op.notIn]: db.sequelize.literal(`(
              SELECT MAX(id) 
              FROM "EmployeeLogs" 
              WHERE action = 'egreso' 
              GROUP BY "employeeName"
            )`)
              }
            },
            attributes: ['employeeName', 'local', 'timestamp'],
            order: [['timestamp', 'ASC']]
          });

          // Get current sellers
          const sellers = await db.Seller.findAll();
          const sellersData = {
            local1: {},
            local2: {}
          };

          // Assign active employees to empty seller slots
          activeEmployees.forEach(employee => {
            const local = employee.local;
            for (let i = 1; i <= 4; i++) {
              const sellerKey = `vendedor${i}`;
              if (!sellersData[local][sellerKey]) {
                sellersData[local][sellerKey] = {
                  name: employee.employeeName,
                  updatedAt: employee.timestamp
                };
                break;
              }
            }
          });

          io.emit('sellers-updated', sellersData);
        } catch (error) {
          console.error('Error refreshing sellers:', error);
        }
      });

      socket.on('add-to-cart', async ({ local, product, quantity }) => {
        try {
          if (!carts[local]) carts[local] = [];

          const existingProduct = carts[local].find(
            (item) => item.id === product.id && item.configurationId === product.configurationId
          );

          if (existingProduct) {
            existingProduct.quantity += quantity;
          } else {
            carts[local].push({ ...product, quantity });
          }

          io.to(local).emit('cart-updated', { local, cart: carts[local] });
        } catch (error) {
          console.error('Error al agregar al carrito:', error);
        }
      });

      socket.on('remove-from-cart', (data) => {
        const { local, productId } = data;
        const cart = carts[local] || [];
        const productIndex = cart.findIndex(item => item?.id === productId);

        if (productIndex !== -1) {
          cart.splice(productIndex, 1);
          io.to(local).emit('cart-updated', { local, cart });
        }
      });

      socket.on('increment-product', (data) => {
        const { local, productId } = data;
        const cart = carts[local] || [];
        const product = cart.find(item => item?.id === productId);

        if (product) {
          product.quantity = (product.quantity || 0) + 1;
          io.to(local).emit('cart-updated', { local, cart });
        }
      });

      socket.on('decrement-product', (data) => {
        const { local, productId } = data;
        const cart = carts[local] || [];
        const product = cart.find(item => item?.id === productId);

        if (product && (product.quantity || 0) > 1) {
          product.quantity = (product.quantity || 0) - 1;
          io.to(local).emit('cart-updated', { local, cart });
        }
      });

      socket.on('stock-update', ({ local, items }) => {
        io.emit('stock-update', { local, items });

        const lowStockItems = items.filter(item =>
          (item.product && item.product.stock <= 5) ||
          (item.newStock !== undefined && item.newStock <= 5)
        );

        if (lowStockItems.length > 0) {
          console.log('Items con stock bajo:', lowStockItems);
        }
      });

      socket.on('send-alert-to-local2', async (data) => {
        const { productName, stockLevel, localFrom } = data;

        try {
          // Enviar email
          await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'empanadaskm11.brc@gmail.com',
            subject: `Alerta de Stock Bajo - ${productName}`,
            html: `
                <h1>⚠️ Alerta de Stock Bajo</h1>
                <p>El producto <strong>${productName}</strong> tiene un stock bajo (${stockLevel} unidades).</p>
                <p>Esta alerta fue enviada desde <strong>${localFrom}</strong>.</p>
                <p>Por favor, reabastece este producto lo antes posible.</p>
                <p>Fecha y hora: ${new Date().toLocaleString()}</p>
            `
          });

          // Enviar alerta a todos los clientes conectados (especialmente Local 2)
          io.emit('stock-alert-notification', {
            productName,
            stockLevel,
            localFrom,
            timestamp: new Date().toISOString()
          });

          socket.emit('alert-email-status', {
            success: true,
            message: 'Alerta enviada correctamente'
          });

        } catch (error) {
          console.error('Error al enviar alerta:', error);
          socket.emit('alert-email-status', {
            success: false,
            message: error.message
          });
        }
      });

      socket.on('get-order-history-range', ({ local, startDate, endDate }) => {
        let orders = readOrders(local);

        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);

          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);

          orders = orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= start && orderDate <= end;
          });
        }

        socket.emit('order-history', orders);
      });

      socket.on('get-order-history', ({ local, date }) => {
        let orders = readOrders(local);

        if (date) {
          orders = orders.filter(order => {
            const orderDateOnly = order.date.split('T')[0];
            return orderDateOnly === date;
          });
        }

        socket.emit('order-history', orders);
      });

      // Add handler for cash register history
      socket.on('get-cash-register-history', async (data) => {
        console.log('Solicitud de historial de cierres de caja recibida:', data);
        
        try {
            // Use database model instead of JSON file
            let history = await db.CashRegisterHistory.findAll();
            
            // Convert to plain objects and ensure numeric values
            history = history.map(entry => {
                const plainEntry = entry.get({ plain: true });
                // Ensure totalAmount is a number
                plainEntry.totalAmount = Number(plainEntry.totalAmount);
                return plainEntry;
            });
            
            // Filter by local if specified
            if (data.local) {
                history = history.filter(entry => entry.local === data.local);
            }
            
            // Filter by date range if specified
            if (data.startDate && data.endDate) {
                const startDate = new Date(data.startDate);
                const endDate = new Date(data.endDate);
                endDate.setHours(23, 59, 59, 999); // Include the entire end day
                
                history = history.filter(entry => {
                    const closeTime = new Date(entry.closeTime);
                    return closeTime >= startDate && closeTime <= endDate;
                });
            }
            
            console.log(`Enviando ${history.length} registros de cierres de caja`);
            socket.emit('update-cash-register-history', history);
        } catch (error) {
            console.error('Error al obtener historial de cierres de caja:', error);
            socket.emit('update-cash-register-history', []);
        }
      });
      
      // Agregar manejador para obtener un cierre de caja específico
      socket.on('get-single-cash-register', async (data) => {
        console.log('Solicitud de cierre de caja individual recibida:', data);
        
        try {
            // Buscar el registro en la base de datos
            const entry = await db.CashRegisterHistory.findOne({
                where: { id: data.id }
            });
            
            if (!entry) {
                console.log('Cierre de caja no encontrado:', data.id);
                socket.emit('single-cash-register', null);
                return;
            }
            
            // Convertir a objeto plano
            const plainEntry = entry.get({ plain: true });
            
            // Asegurar que los valores numéricos sean números
            if (plainEntry.paymentSummary) {
                plainEntry.paymentSummary.total = Number(plainEntry.paymentSummary.total || 0);
                plainEntry.paymentSummary.efectivo = Number(plainEntry.paymentSummary.efectivo || 0);
                plainEntry.paymentSummary.transferencia = Number(plainEntry.paymentSummary.transferencia || 0);
                plainEntry.paymentSummary.mixto = Number(plainEntry.paymentSummary.mixto || 0);
            }
            
            console.log('Enviando cierre de caja:', plainEntry.id);
            socket.emit('single-cash-register', { ...plainEntry, forPrint: data.forPrint });
          } catch (error) {
              console.error('Error al obtener cierre de caja individual:', error);
              socket.emit('single-cash-register', null);
          }
      });

      socket.on('disconnect', () => {
        console.log('Cliente desconectado');
      });
    });

  }).catch(err => {
    console.error('Error al sincronizar la base de datos:', err);
  });

let carts = {
  local1: [],
  local2: []
};
let cashRegister = { 
  totalPayments: 0, 
  totalAmount: 0,
  startTime: new Date().toISOString() // Add this line
};
let lastCashRegisterClose = { local1: null, local2: null };

// Authentication credentials
const credentials = {
  local1: { user: 'admin1', password: bcrypt.hashSync('password1', 10) },
  local2: { user: 'admin2', password: bcrypt.hashSync('password2', 10) },
  admin: { user: 'admin', password: bcrypt.hashSync('passworddaniel', 10) }
};

// File IO helpers
function readFile(filePath, defaultValue = []) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return defaultValue;
  }
}

function writeFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readOrders(local) {
  return readFile(`data/orders-${local}.json`, []);
}

function writeOrders(local, orders) {
  writeFile(`data/orders-${local}.json`, orders);
}

// Replace these file-based functions with database functions
async function readCashRegisterHistory() {
  try {
    const history = await db.CashRegisterHistory.findAll();
    return history;
  } catch (error) {
    console.error('Error reading cash register history from DB:', error);
    return [];
  }
}

async function writeCashRegisterHistory(data) {
  try {
    // If data is an array of entries
    if (Array.isArray(data)) {
      // Delete all existing entries and replace with new ones
      await db.CashRegisterHistory.destroy({ where: {} });
      await db.CashRegisterHistory.bulkCreate(data);
    } else {
      // If it's a single entry, create it
      await db.CashRegisterHistory.create(data);
    }
    return true;
  } catch (error) {
    console.error('Error writing cash register history to DB:', error);
    return false;
  }
}

function readSellers() {
  return readFile('data/sellers.json', {
    local1: [],
    local2: []
  });
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
    if (req.session.user === 'admindaniel' || req.session.local === 'admin') {
      return next();
    }
    if (req.session.local === 'local1' || req.session.local === 'local2') {
      return next();
    }
  }
  res.redirect('/login');
}

// Initialize data
function loadLastCloseTimes() {
  try {
    // Replace this with a database query
    db.CashRegisterHistory.findAll()
      .then(historyRecords => {
        // Convert Sequelize models to plain objects
        const history = historyRecords.map(record => record.get({ plain: true }));
        
        // Now we can safely use forEach
        history.forEach(entry => {
          if (entry.local && entry.closeTime) {
            lastCashRegisterClose[entry.local] = entry.closeTime;
          }
        });
        console.log('Historial de cierres de caja cargado correctamente');
      })
      .catch(error => {
        console.error('Error al cargar historial de cierre desde DB:', error);
      });
  } catch (error) {
    console.error('Error al cargar historial de cierre:', error);
  }
}

// Routes
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
app.get('/local1', isAuthenticated, async (req, res) => {
  try {
    const products = await Product.findAll({ where: { local: 'local1' } });
    res.render('local1', {
      products: products.map(p => p.get({ plain: true })),
      user: req.session.user
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).send('Error al cargar los productos');
  }
});

app.get('/local2', isAuthenticated, async (req, res) => {
  try {
    const products = await Product.findAll({ where: { local: 'local2' } });
    res.render('local2', {
      products: products.map(p => p.get({ plain: true })),
      user: req.session.user
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).send('Error al cargar los productos');
  }
});

app.get('/admin', isAuthenticated, async (req, res) => {
  if (req.session.user !== 'admin') {
    return res.redirect('/login');
  }
  try {
    const products = await db.Product.findAll({ where: { local: 'local1' } });
    res.render('admin', {
      products: products.map(p => p.get({ plain: true })),
      user: req.session.user
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).send('Error al cargar productos');
  }
});

// API Routes
app.get('/api/categories', async (req, res) => {
  try {
    const products = await db.Product.findAll();
    const categories = [...new Set(products.map(p => p.category))];
    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agregar esta ruta antes de la inicialización del servidor
app.get('/get-categories/:local', async (req, res) => {
  try {
    const { local } = req.params;
    const products = await Product.findAll({ where: { local } });
    const categories = [...new Set(products.map(p => p.category))];  // Definir categories aquí
    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});
// Product CRUD operations
app.get('/api/products', async (req, res) => {
  try {
    const local = req.query.local;
    if (!local) {
      return res.status(400).json({ error: 'Local is required' });
    }

    const products = await Product.findAll({ where: { local } });
    res.json(products.map(p => p.get({ plain: true })));
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/product/:id', productController.getProductById);

app.post('/add-product/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const productData = req.body;

    const newProduct = await Product.create({
      ...productData,
      local: location
    });

    if (location === 'local2') {
      const existingProduct = await Product.findOne({
        where: {
          name: productData.name,
          local: 'local1'
        }
      });

      if (!existingProduct) {
        await Product.create({
          ...productData,
          local: 'local1',
          stock: 0
        });
      }
    }

    res.json({ success: true, product: newProduct.get({ plain: true }) });
  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.put('/update-product/:location/:id', async (req, res) => {
  try {
    const { location, id } = req.params;
    const updates = req.body;

    const [updated] = await Product.update(updates, {
      where: { id, local: location }
    });

    if (updated) {
      const product = await Product.findOne({ where: { id, local: location } });
      res.json({ success: true, product });
    } else {
      res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/delete-product/:local/:id', isAuthenticated, productController.deleteProduct);
app.delete('/delete-product/:location/:id', async (req, res) => {
  try {
    const { location, id } = req.params;
    const product = await Product.findOne({ where: { id, local: location } });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    await product.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stock transfer
app.post('/transfer-stock', async (req, res) => {
    try {
        const { productId, quantity, fromLocation, toLocation } = req.body;

        // Buscar el producto en la ubicación de origen
        const sourceProduct = await Product.findOne({
            where: { id: productId, local: fromLocation }
        });

        if (!sourceProduct) {
            return res.status(404).json({ error: 'Producto no encontrado en la ubicación de origen' });
        }

        if (sourceProduct.stock < quantity) {
            return res.status(400).json({ error: 'Stock insuficiente para transferir' });
        }

        // Actualizar el stock del producto origen
        await sourceProduct.decrement('stock', { by: parseInt(quantity) });
        const updatedSourceProduct = await sourceProduct.reload();

        // Buscar o crear el producto en el destino
        const [destinationProduct] = await Product.findOrCreate({
            where: { name: sourceProduct.name, local: toLocation },
            defaults: {
                category: sourceProduct.category,
                price: sourceProduct.price,
                stock: 0,
                description: sourceProduct.description,
                isCompound: sourceProduct.isCompound,
                components: sourceProduct.components
            }
        });

        // Actualizar el stock del producto destino
        await destinationProduct.increment('stock', { by: parseInt(quantity) });
        const updatedDestProduct = await destinationProduct.reload();

        // Emitir un solo evento de actualización por producto
        io.emit('stock-update', {
            productId: sourceProduct.id,
            newStock: updatedSourceProduct.stock,
            sourceLocation: fromLocation
        });

        res.json({ 
            success: true,
            sourceStock: updatedSourceProduct.stock,
            destinationStock: updatedDestProduct.stock
        });
    } catch (error) {
        console.error('Error al transferir stock:', error);
        res.status(500).json({ error: 'Error al transferir stock' });
    }
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

  sellersHistory.push({
    seller,
    oldName: sellers[local][seller] ? sellers[local][seller].name : null,
    newName: name,
    updatedAt: new Date().toISOString(),
    local
  });

  sellers[local][seller] = {
    name,
    updatedAt: new Date().toISOString()
  };

  writeSellers(sellers);
  writeSellersHistory(sellersHistory);

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
app.post('/log-employee', async (req, res) => {
  const { employeeName, action } = req.body;
  const local = req.headers['x-local'];

  try {
    const employeeLog = await db.EmployeeLog.create({
      employeeName,
      action,
      local,
      timestamp: new Date()
    });

    const sellers = await db.Seller.findAll();

    if (action === 'ingreso') {
      for (const seller of sellers) {
        if (!seller.employeeName) {
          await seller.update({ employeeName });
          break;
        }
      }
    } else if (action === 'egreso') {
      for (const seller of sellers) {
        if (seller.employeeName === employeeName) {
          await seller.update({ employeeName: null });
          break;
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al agregar registro de empleado:', error);
    res.status(500).json({ success: false });
  }
});

app.get('/get-current-sellers', (req, res) => {
  const sellers = readSellers();
  res.json(sellers);
});

app.get('/get-employee-logs', async (req, res) => {
  const { startDate, endDate, employeeName } = req.query;

  try {
    let logs = await db.EmployeeLog.findAll();

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      logs = logs.filter(log => {
        const logDate = new Date(log.createdAt);
        return logDate >= start && logDate <= end;
      });
    }

    if (employeeName) {
      logs = logs.filter(log =>
        log.employeeName.toLowerCase().includes(employeeName.toLowerCase())
      );
    }

    res.json(logs);
  } catch (error) {
    console.error('Error al obtener registros de empleados:', error);
    res.status(500).json({ success: false });
  }
});

// Cash register
app.get('/cash-register', (req, res) => {
  res.json({
    ...cashRegister,
    startTime: cashRegister.startTime
  });
});

app.post('/cash-register', (req, res) => {
  const { totalPayments, totalAmount } = req.body;
  cashRegister.totalPayments = totalPayments;
  cashRegister.totalAmount = totalAmount;
  // Don't modify startTime here
  res.json({ success: true });
});

// Data cleanup
// app.post('/clean-old-data', (req, res) => {
//   const local = req.headers['x-local'];

//   try {
//     const fiveDaysAgo = new Date();
//     fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

//     let orders = readFile(ordersPath, []);
//     let orders2 = readFile(orders2Path, []);

//     const filteredOrders = orders.filter(order => {
//       const orderDate = new Date(order.date);
//       return orderDate >= fiveDaysAgo && order.local === local;
//     });

//     const filteredOrders2 = orders2.filter(order => {
//       const orderDate = new Date(order.date);
//       return orderDate >= fiveDaysAgo && order.local === local;
//     });

//     writeFile(ordersPath, filteredOrders);
//     writeFile(orders2Path, filteredOrders2);

//     let sellersHistory = readFile(sellersHistoryPath, []);

//     const filteredSellersHistory = sellersHistory.filter(entry => {
//       const entryDate = new Date(entry.updatedAt);
//       return entryDate >= fiveDaysAgo && entry.local === local;
//     });

//     writeFile(sellersHistoryPath, filteredSellersHistory);

//     let cashRegisterHistory = readFile(cashRegisterFilePath, []);

//     const filteredCashRegisterHistory = cashRegisterHistory.filter(entry => {
//       const entryDate = new Date(entry.date);
//       return entryDate >= fiveDaysAgo && entry.local === local;
//     });

//     writeFile(cashRegisterFilePath, filteredCashRegisterHistory);

//     res.status(200).json({ success: true, message: 'Datos antiguos eliminados correctamente' });
//   } catch (error) {
//     console.error('Error al limpiar los datos antiguos:', error);
//     res.status(500).json({ success: false, message: 'Error al limpiar los datos antiguos' });
//   }
// });

// Add this route for admin delete
app.delete('/api/product/:id', isAuthenticated, productController.deleteProduct);

// Add these routes along with your other route definitions
app.post('/api/cash-register/start', async (req, res) => {
    try {
        const { startTime } = req.body;
        cashRegister.startTime = startTime;
        res.json({ 
            success: true, 
            message: 'Cash register started successfully',
            startTime 
        });
    } catch (error) {
        console.error('Error starting cash register:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Modificar estas rutas para mantener consistencia
app.get('/api/cash-register/close', cashRegisterHistoryController.getCashRegisterHistory);
app.post('/api/cash-register/close', cashRegisterHistoryController.addCashRegisterEntry);
app.get('/api/cash-register/close/date', cashRegisterHistoryController.getCashRegisterHistoryByDate);

// Eliminar o comentar las rutas antiguas
// app.get('/api/cash-register/history', cashRegisterHistoryController.getCashRegisterHistory);
// app.get('/api/cash-register/history/date', cashRegisterHistoryController.getCashRegisterHistoryByDate);

app.get('/cash-register', (req, res) => {
    res.json({
        ...cashRegister,
        startTime: cashRegister.startTime
    });
});

app.post('/cash-register', (req, res) => {
    const { totalPayments, totalAmount } = req.body;
    cashRegister.totalPayments = totalPayments;
    cashRegister.totalAmount = totalAmount;
    res.json({ success: true });  
});

app.post('/api/stock/:local/update', async (req, res) => {
  try {
    const { local } = req.params;
    const { items } = req.body;

    console.log(`Actualizando stock en ${local}:`, items);

    for (const item of items) {
      if (item.isCompound && item.stockToUpdate) {
        // Actualizar stock de componentes de productos compuestos
        for (const component of item.stockToUpdate) {
          await db.Product.update(
            { 
              stock: db.sequelize.literal(`stock - ${component.quantityToReduce}`) 
            },
            { 
              where: { 
                id: component.id,
                local: local 
              }
            }
          );
          console.log(`Stock actualizado para componente ${component.name} en ${local}`);
        }
      } else if (item.stockToUpdate) {
        // Actualizar stock de productos simples
        await db.Product.update(
          { 
            stock: db.sequelize.literal(`stock - ${item.stockToUpdate[0].quantityToReduce}`) 
          },
          { 
            where: { 
              id: item.stockToUpdate[0].id,
              local: local 
            }
          }
        );
        console.log(`Stock actualizado para producto ${item.name} en ${local}`);
      }
    }

    res.json({ success: true, message: 'Stock actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
