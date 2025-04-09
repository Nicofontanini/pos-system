// migrate.js
const fs = require('fs');
const path = require('path');
const sequelize = require('./config/config');
const OrderLocal1 = require('./models/orderLocal1');
const OrderLocal2 = require('./models/orderLocal2');
const Product = require('./models/product');
const CashRegisterHistory = require('./models/cashRegisterHistory');
const EmployeeLogs = require('./models/employeeLogs');
const Sellers = require('./models/sellers');
const SellersHistory = require('./models/sellersHistory');

async function migrateData() {
  try {
    // Intentar conectar a la base de datos
    await sequelize.authenticate();
    console.log('Conexión exitosa a la base de datos');
    
    // Crear las tablas si no existen
    await sequelize.sync({ force: true });
    
    // Leer datos de los archivos JSON
    const orders1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'orders.json')));
    const orders2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'orders2.json')));
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json')));
    const cashRegisterHistory = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cashRegisterHistory.json')));
    const sellers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'sellers.json')));
    const sellersHistory = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'sellers_history.json')));
    const employeeLogs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'employee_logs.json')));

    // Insertar productos
    let productId = 1;
    for (const local in products) {
      for (const product of products[local].products) {
        await Product.create({
          id: productId++,
          name: product.name,
          category: product.category,
          price: product.price,
          local: local
        });
      }
    }

    // Insertar órdenes de local1
    for (const order of orders1) {
      await OrderLocal1.create(order);
    }

    // Insertar órdenes de local2
    for (const order of orders2) {
      await OrderLocal2.create(order);
    }

    // Insertar historial de caja
    for (const entry of cashRegisterHistory) {
      await CashRegisterHistory.create(entry);
    }

    // Insertar vendedores
    for (const local in sellers) {
      const localSellers = sellers[local];
      let position = 1;
      
      for (const sellerId in localSellers) {
        const seller = localSellers[sellerId];
        if (seller) { // Solo procesar si el vendedor no es null
          // Crear un ID único combinando local e ID del vendedor
          const uniqueId = `${local}_${sellerId}`;
          await Sellers.create({
            id: uniqueId,
            name: seller.name,
            local: local,
            position: position++,
            status: 'offline',
            lastLogin: seller.updatedAt,
            lastLogout: null
          });
        } else {
          position++;
        }
      }
    }

    // Insertar historial de vendedores
    for (const entry of sellersHistory) {
      // Crear un ID único usando el local del registro o local1 por defecto
      const uniqueId = `${entry.local || 'local1'}_${entry.seller}`;
      await SellersHistory.create({
        sellerId: uniqueId,
        loginTime: entry.updatedAt,
        logoutTime: null,
        local: entry.local || 'local1'
      });
    }

    // Insertar logs de empleados
    for (const entry of employeeLogs) {
      await EmployeeLogs.create({
        employeeId: entry.employeeName,
        action: entry.action,
        timestamp: entry.timestamp,
        local: entry.local,
        details: null
      });
    }

    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

migrateData();