// controllers/sellersHistoryController.js
const { readSellersHistory, writeSellersHistory } = require('../app');

exports.getSellersHistory = async (req, res) => {
  try {
    const history = readSellersHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSellerHistory = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const history = readSellersHistory();
    
    const sellerHistory = history.filter(entry => entry.sellerId === sellerId);
    res.json(sellerHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.filterSellersHistory = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const history = readSellersHistory();
    
    const filteredHistory = history.filter(entry => {
      const entryDate = new Date(entry.loginTime);
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });
    
    res.json(filteredHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addSellerHistoryEntry = async (req, res) => {
  try {
    const newEntry = req.body;
    
    // Leer historial existente
    let history = readSellersHistory();
    
    // Agregar nueva entrada
    history.push(newEntry);
    
    // Guardar cambios
    writeSellersHistory(history);
    
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSellerHistoryEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const updates = req.body;
    
    // Leer historial existente
    let history = readSellersHistory();
    
    // Encontrar y actualizar la entrada
    const entryIndex = history.findIndex(entry => entry.id === entryId);
    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    history[entryIndex] = { ...history[entryIndex], ...updates };
    
    // Guardar cambios
    writeSellersHistory(history);
    
    res.json(history[entryIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSellerHistoryEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    
    // Leer historial existente
    let history = readSellersHistory();
    
    // Encontrar y eliminar la entrada
    const entryIndex = history.findIndex(entry => entry.id === entryId);
    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    history.splice(entryIndex, 1);
    
    // Guardar cambios
    writeSellersHistory(history);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
