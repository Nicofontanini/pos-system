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

    // Check if items column exists
    console.log('Checking if items column exists...');
    const [exists] = await db.sequelize.query(
      'SELECT 1 FROM information_schema.columns WHERE table_name = \'Orders\' AND column_name = \'items\''
    );

    if (!exists[0]) {
      // Add items column as nullable first
      console.log('Adding items column to Orders table...');
      await db.sequelize.query('ALTER TABLE "Orders" ADD COLUMN "items" JSON[];');

      // Update existing rows with default empty array
      console.log('Updating existing rows with default items value...');
      await db.sequelize.query('UPDATE "Orders" SET "items" = array[]::json[] WHERE "items" IS NULL;');

      // Make the column NOT NULL
      console.log('Making items column NOT NULL...');
      await db.sequelize.query('ALTER TABLE "Orders" ALTER COLUMN "items" SET NOT NULL;');
    }

    // Leer datos de los archivos JSON
    const orders1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'orders.json')));
    const orders2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'orders2.json')));
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json')));
    const sellers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'sellers.json')));
    const sellersHistory = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'sellers_history.json')));
    const employeeLogs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'employee_logs.json')));

    // Limpiar la tabla CashRegisterHistory
    await db.CashRegisterHistory.destroy({
      where: {},
      truncate: true,
      restartIdentity: true
    });

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

          if (!existingProduct) {
            const newProduct = {
              name: product.name,
              category: product.category,
              price: product.price,
              stock: product.stock,
              description: product.description || null,
              isCompound: product.isCompound || false,
              components: product.components || null,
              local: local
            };

            await db.Product.create(newProduct);
            console.log(`Producto ${product.name} creado exitosamente`);
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
      order.local = 'local1';
      await db.Orders.create(order);
    }

    // Insertar órdenes de local2
    for (const order of orders2) {
      // Asegúrate de que cada orden tenga un vendedor
      if (!order.seller) {
        order.seller = 'default'; // O el ID de un vendedor existente
      }
      order.local = 'local2';
      await db.Orders.create(order);
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
            await db.Seller.create({
              id: uniqueId,
              name: seller.name,
              local: local,
              updatedAt: new Date(seller.updatedAt)
            });
          } catch (error) {
            // Si hay un error de duplicado, actualizar el vendedor existente
            if (error.name === 'SequelizeUniqueConstraintError') {
              await db.Seller.update({
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
      await db.EmployeeLog.create({
        employeeName: entry.employeeName || 'Empleado Sin Nombre',
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

module.exports = {
  migrateData
};

// migrateData();