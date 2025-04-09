// migrate.js
const fs = require('fs');
const path = require('path');
const sequelize = require('./config/config');
const Order = require('./models/order');
const Product = require('./models/product');
const CashRegisterHistory = require('./models/cashRegisterHistory');

async function migrateData() {
  try {
    // Intentar conectar a la base de datos
    await sequelize.authenticate();
    console.log('Conexión exitosa a la base de datos');
    
    // Crear las tablas si no existen
    await sequelize.sync({ force: true });
    
    // Leer datos de los archivos JSON
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'orders.json')));
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json')));
    const cashRegisterHistory = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cashRegisterHistory.json')));

    // Insertar productos
    let productId = 1;
    for (const local in products) {
      for (const product of products[local].products) {
        await Product.create({
          id: productId++,
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          description: product.description,
          isCompound: product.isCompound || false,
          local
        });
      }
    }

    // Insertar órdenes
    for (const order of orders) {
      await Order.create(order);
    }

    // Insertar historial de caja
    for (const entry of cashRegisterHistory) {
      // Aseguramos que paymentMethod tenga un valor
      await CashRegisterHistory.create({
        local: entry.local,
        totalAmount: entry.totalAmount,
        paymentMethod: entry.paymentMethod || 'Efectivo' // Valor por defecto si no existe
      });
    }

    console.log('Migración completada');
  } catch (error) {
    console.error('Error al migrar datos:', error);
  }
}

migrateData();