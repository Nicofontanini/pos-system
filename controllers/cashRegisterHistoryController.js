// controllers/cashRegisterHistoryController.js
const { readCashRegisterHistory, writeCashRegisterHistory } = require('../app');
const { filterCashRegisterHistoryByDate } = require('../app');
const db = require('../models');

exports.getCashRegisterHistory = async (req, res) => {
    try {
        console.log('Petición recibida en getCashRegisterHistory');
        const history = await db.CashRegisterHistory.findAll({
            order: [['date', 'DESC']]
        });
        console.log('Datos encontrados en DB:', history);
        res.json(history);
    } catch (error) {
        console.error('Error en getCashRegisterHistory:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

exports.getCashRegisterHistoryByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const history = readCashRegisterHistory();
    const filteredHistory = filterCashRegisterHistoryByDate(history, startDate, endDate);
    res.json(filteredHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addCashRegisterEntry = async (req, res) => {
  try {
    const data = req.body;
    // Ensure ID is present
    if (!data.id) {
      data.id = crypto.randomUUID();
    }
    
    const entry = await db.CashRegisterHistory.create(data);
    res.json({ success: true, entry });
  } catch (error) {
    console.error('Error creating cash register entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateCashRegisterEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const history = readCashRegisterHistory();
    const entryIndex = history.findIndex(entry => entry.id === id);
    
    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    history[entryIndex] = { ...history[entryIndex], ...updates };
    writeCashRegisterHistory(history);
    res.json(history[entryIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCashRegisterEntry = async (req, res) => {
  try {
    const { id } = req.params;
    
    const history = readCashRegisterHistory();
    const entryIndex = history.findIndex(entry => entry.id === id);
    
    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    history.splice(entryIndex, 1);
    writeCashRegisterHistory(history);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
