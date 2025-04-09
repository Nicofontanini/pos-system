const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isCompound: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  local: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Product;