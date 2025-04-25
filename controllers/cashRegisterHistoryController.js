// controllers/cashRegisterHistoryController.js
// Remove these lines
// const { readCashRegisterHistory, writeCashRegisterHistory } = require('../app');
// const { filterCashRegisterHistoryByDate } = require('../app');

// Add these instead
const { 
  readCashRegisterHistory, 
  writeCashRegisterHistory,
  filterCashRegisterHistoryByDate 
} = require('../utils/cashRegisterUtils');

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
        const closeData = req.body;
        const currentDate = new Date(); // Creamos una fecha actual por defecto
        
        // Aseguramos que todos los campos tengan valores válidos
        const entry = {
            date: closeData.date || currentDate, // Usamos la fecha del cierre o la actual
            totalPayments: parseInt(closeData.totalPayments) || 0,
            totalAmount: parseFloat(closeData.totalAmount) || 0,
            local: closeData.local,
            closeTime: closeData.closeTime || currentDate,
            startTime: closeData.startTime,
            productSummary: closeData.productSummary || [],
            paymentSummary: {
                efectivo: parseFloat(closeData.paymentSummary?.efectivo) || 0,
                transferencia: parseFloat(closeData.paymentSummary?.transferencia) || 0,
                mixto: parseFloat(closeData.paymentSummary?.mixto) || 0,
                total: parseFloat(closeData.paymentSummary?.total) || 0
            },
            ordersCount: parseInt(closeData.ordersCount) || 0,
            orders: closeData.orders || []
        };

        // Validación adicional
        if (!entry.date) {
            throw new Error('La fecha es requerida');
        }

        const result = await db.CashRegisterHistory.create(entry);
        res.json({ success: true, data: result });
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
