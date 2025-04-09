// models/sellersHistory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const SellersHistory = sequelize.define('SellersHistory', {
  sellerId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Sellers',
      key: 'id'
    }
  },
  loginTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  logoutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalSales: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10,2),
    defaultValue: 0.00
  },
  local: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = SellersHistory;
