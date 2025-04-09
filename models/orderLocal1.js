// models/orderLocal1.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const OrderLocal1 = sequelize.define('OrderLocal1', {
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
  tableName: 'orders_local1'
});

module.exports = OrderLocal1;
