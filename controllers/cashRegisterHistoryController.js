// controllers/cashRegisterHistoryController.js
const { readCashRegisterHistory, writeCashRegisterHistory } = require('../app');
const { filterCashRegisterHistoryByDate } = require('../app');
const db = require('../models');

exports.getCashRegisterHistory = async (req, res) => {
  try {
    const history = readCashRegisterHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const { local, totalPayments, totalAmount, productSummary, startTime, closeTime } = req.body;
    
    const history = readCashRegisterHistory();
    history.push({
      date: new Date(),
      totalPayments,
      totalAmount,
      local,
      startTime,
      closeTime,
      productSummary
    });

    writeCashRegisterHistory(history);
    res.status(201).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
