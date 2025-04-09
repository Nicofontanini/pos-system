// models/sellers.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const Sellers = sequelize.define('Sellers', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  local: {
    type: DataTypes.STRING,
    allowNull: false
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'inactive'
  }
}, {
  timestamps: true
});

module.exports = Sellers;
