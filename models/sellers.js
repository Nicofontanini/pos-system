// models/sellers.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const Sellers = sequelize.define('Sellers', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
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
    defaultValue: 'offline'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLogout: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: false
});

module.exports = Sellers;
