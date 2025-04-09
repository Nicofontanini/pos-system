const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const Order = sequelize.define('Order', {
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  paymentAmounts: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  local: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orderName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sellerName: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Order;