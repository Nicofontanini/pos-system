// models/orderLocal2.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const OrderLocal2 = sequelize.define('OrderLocal2', {
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
  orderName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sellerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  local: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'orders_local2'
});

module.exports = OrderLocal2;
