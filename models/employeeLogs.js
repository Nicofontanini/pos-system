// models/employeeLogs.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const EmployeeLogs = sequelize.define('EmployeeLogs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  local: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: false
});

module.exports = EmployeeLogs;
