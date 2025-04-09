// models/cashRegisterHistory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const CashRegisterHistory = sequelize.define('CashRegisterHistory', {
  date: {
    type: DataTypes.DATE,
    allowNull: true  // Cambiado a true para permitir valores nulos
  },
  totalPayments: {
    type: DataTypes.INTEGER,
    allowNull: true  // Cambiado a true
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  local: {
    type: DataTypes.STRING,
    allowNull: false
  },
  closeTime: {
    type: DataTypes.DATE,
    allowNull: true  // Cambiado a true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true  // Cambiado a true
  },
  productSummary: {
    type: DataTypes.JSON,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = CashRegisterHistory;