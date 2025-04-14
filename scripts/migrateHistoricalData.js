const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

async function migrateHistoricalData() {
  try {
    // Leer el archivo JSON principal
    const local1Data = JSON.parse(
      await fs.readFile(path.join(__dirname, '../data/cashRegisterHistory.json'), 'utf8')
    );

    // Intentar leer el segundo archivo, si existe
    let local2Data = [];
    try {
      local2Data = JSON.parse(
        await fs.readFile(path.join(__dirname, '../data/cashRegisterHistory2.json'), 'utf8')
      );
    } catch (err) {
      console.log('No se encontró archivo para local2, continuando solo con local1');
    }

    // Combinar los datos
    const allData = [
      ...local1Data.map(record => ({ ...record, local: record.local || 'local1' })),
      ...local2Data.map(record => ({ ...record, local: record.local || 'local2' }))
    ];

    // Migrar cada registro
    for (const record of allData) {
      await db.CashRegisterHistory.create({
        id: uuidv4(),
        date: record.date || new Date(),
        totalPayments: record.totalPayments || 0,
        totalAmount: record.totalAmount || 0,
        local: record.local,
        closeTime: record.closeTime || new Date(),
        startTime: record.startTime || new Date(),
        productSummary: record.productSummary || [],
        paymentSummary: record.paymentSummary || {
          efectivo: 0,
          transferencia: 0,
          mixto: 0,
          total: 0
        },
        ordersCount: record.ordersCount || 0,
        orders: record.orders || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Registro migrado para ${record.local}`);
    }

    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error durante la migración:', error);
  }
}

// Ejecutar la migración
migrateHistoricalData();