// models/cashRegisterHistory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const CashRegisterHistory = sequelize.define('CashRegisterHistory', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  totalPayments: {
    type: DataTypes.INTEGER,
    allowNull: false
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
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  productSummary: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'CashRegisterHistories'
});

module.exports = CashRegisterHistory;