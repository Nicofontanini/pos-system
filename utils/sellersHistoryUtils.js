const db = require('../models');

async function readSellersHistory() {
  try {
    return await db.SellersHistory.findAll();
  } catch (error) {
    console.error('Error reading sellers history:', error);
    return [];
  }
}

async function writeSellersHistory(data) {
  try {
    if (Array.isArray(data)) {
      await db.SellersHistory.destroy({ where: {} });
      await db.SellersHistory.bulkCreate(data);
    } else {
      await db.SellersHistory.create(data);
    }
    return true;
  } catch (error) {
    console.error('Error writing sellers history:', error);
    return false;
  }
}

module.exports = {
  readSellersHistory,
  writeSellersHistory
};