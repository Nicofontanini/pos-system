// controllers/sellersController.js
const Sellers = require('../models/sellers');
const SellersHistory = require('../models/sellers_history');
const db = require('../models');

// Get all sellers
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await Sellers.findAll();
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get seller by ID
exports.getSellerById = async (req, res) => {
  try {
    const seller = await Sellers.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new seller
exports.createSeller = async (req, res) => {
  try {
    const seller = await Sellers.create(req.body);
    res.status(201).json(seller);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update seller
exports.updateSeller = async (req, res) => {
  try {
    const [updated] = await Sellers.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedSeller = await Sellers.findByPk(req.params.id);
      res.json(updatedSeller);
    } else {
      res.status(404).json({ error: 'Seller not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete seller
exports.deleteSeller = async (req, res) => {
  try {
    const deleted = await Sellers.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Seller not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get seller history
exports.getSellerHistory = async (req, res) => {
  try {
    const history = await SellersHistory.findAll({
      where: { sellerId: req.params.id }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Record seller login
exports.recordLogin = async (req, res) => {
  try {
    const history = await SellersHistory.create({
      sellerId: req.body.sellerId,
      loginTime: new Date(),
      local: req.body.local
    });
    res.status(201).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Record seller logout
exports.recordLogout = async (req, res) => {
  try {
    const history = await SellersHistory.update({
      logoutTime: new Date(),
      totalSales: req.body.totalSales,
      totalAmount: req.body.totalAmount
    }, {
      where: {
        sellerId: req.body.sellerId,
        logoutTime: null
      }
    });
    res.status(200).json({ message: 'Logout recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
