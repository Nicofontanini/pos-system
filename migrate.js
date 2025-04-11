// migrate.js
const fs = require('fs');
const path = require('path');
const db = require('./models');

async function migrateData() {
  try {
    // Intentar conectar a la base de datos
    await db.sequelize.authenticate();
    console.log('Conexión exitosa a la base de datos');

    // Crear las tablas si no existen
    await db.sequelize.sync({ alter: true });

    // Leer datos de los archivos JSON
    const orders1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'orders.json')));
    const orders2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'orders2.json')));
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json')));
    const cashRegisterHistory = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cashRegisterHistory.json')));
    const sellers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'sellers.json')));
    const sellersHistory = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'sellers_history.json')));
    const employeeLogs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'employee_logs.json')));

    // Insertar productos
    for (const local in products) {
      for (const product of products[local].products) {
        try {
          // Primero intentar encontrar el producto existente
          const existingProduct = await db.Product.findOne({
            where: {
              name: product.name,
              local: local
            }
          });

          if (existingProduct) {
            // Si existe, actualizar el stock y otros campos
            await existingProduct.update({
              stock: product.stock,
              price: product.price,
              category: product.category
            });
          } else {
            // Si no existe, crearlo
            await db.Product.create({
              name: product.name,
              category: product.category,
              price: product.price,
              local: local,
              stock: product.stock
            });
          }
        } catch (error) {
          console.error(`Error al procesar producto ${product.name}:`, error);
        }
      }
    }

    // Insertar órdenes de local1
    for (const order of orders1) {
      // Asegúrate de que cada orden tenga un vendedor
      if (!order.seller) {
        order.seller = 'default'; // O el ID de un vendedor existente
      }
      await db.OrderLocal1.create(order);
    }

    // Insertar órdenes de local2
    for (const order of orders2) {
      // Asegúrate de que cada orden tenga un vendedor
      if (!order.seller) {
        order.seller = 'default'; // O el ID de un vendedor existente
      }
      await db.OrderLocal2.create(order);
    }

    // Insertar historial de caja
    for (const entry of cashRegisterHistory) {
      // Asegúrate de que todos los campos requeridos tengan valores
      await db.CashRegisterHistory.create({
        local: entry.local || 'local1',
        closeTime: new Date(entry.closeTime),
        startTime: new Date(entry.startTime),
        totalSales: entry.totalAmount || 0,
        cashInDrawer: entry.cashInDrawer || 0,
        difference: entry.difference || 0,
        totalPayments: entry.totalPayments || 0,
        totalAmount: entry.totalAmount || 0,
        ordersCount: entry.ordersCount || 0,
        paymentSummary: entry.paymentSummary || null,
        productSummary: entry.productSummary || null,
        orders: entry.orders || null
      });
    }

    // Insertar vendedores
    for (const local in sellers) {
      const localSellers = sellers[local];
      
      for (const sellerId in localSellers) {
        const seller = localSellers[sellerId];
        if (seller && seller.name) { // Solo procesar si el vendedor no es null y tiene nombre
          // Crear un ID único combinando local e ID del vendedor
          const uniqueId = `${local}_${sellerId}`;
          
          try {
            // Intentar crear el vendedor
            await db.Sellers.create({
              id: uniqueId,
              name: seller.name,
              local: local,
              updatedAt: new Date(seller.updatedAt)
            });
          } catch (error) {
            // Si hay un error de duplicado, actualizar el vendedor existente
            if (error.name === 'SequelizeUniqueConstraintError') {
              await db.Sellers.update({
                name: seller.name,
                updatedAt: new Date(seller.updatedAt)
              }, {
                where: {
                  id: uniqueId
                }
              });
            } else {
              console.error(`Error al procesar vendedor ${sellerId} en ${local}:`, error);
            }
          }
        }
      }
    }

    // Insertar logs de empleados
    for (const entry of employeeLogs) {
      // Asegurarse de que todos los campos requeridos tengan valores
      await db.EmployeeLogs.create({
        employeeId: entry.employeeName || 'Empleado Sin Nombre',
        action: entry.action || 'login',
        timestamp: entry.timestamp || new Date(),
        local: entry.local || 'local1',
        details: entry.details || null
      });
    }

    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

migrateData();