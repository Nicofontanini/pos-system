const express = require('express');
const router = express.Router();
const cashRegisterHistoryController = require('../controllers/cashRegisterHistoryController');

// Get all cash register closures
router.get('/closures', cashRegisterHistoryController.getAllCashRegisterClosures);

// Get cash register closures by local
router.get('/closures/:local', cashRegisterHistoryController.getCashRegisterClosuresByLocal);

module.exports = router;