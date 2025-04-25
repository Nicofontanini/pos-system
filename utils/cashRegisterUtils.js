const db = require('../models');

async function readCashRegisterHistory() {
  try {
    return await db.CashRegisterHistory.findAll();
  } catch (error) {
    console.error('Error reading cash register history:', error);
    return [];
  }
}

async function writeCashRegisterHistory(data) {
  try {
    if (Array.isArray(data)) {
      await db.CashRegisterHistory.destroy({ where: {} });
      await db.CashRegisterHistory.bulkCreate(data);
    } else {
      await db.CashRegisterHistory.create(data);
    }
    return true;
  } catch (error) {
    console.error('Error writing cash register history:', error);
    return false;
  }
}

function filterCashRegisterHistoryByDate(history, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return history.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= start && entryDate <= end;
  });
}

module.exports = {
  readCashRegisterHistory,
  writeCashRegisterHistory,
  filterCashRegisterHistoryByDate
};