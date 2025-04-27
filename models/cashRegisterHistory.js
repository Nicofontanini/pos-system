const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CashRegisterHistory extends Model {}

  CashRegisterHistory.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // Cambiamos 'date' por 'registerDate' para evitar palabras reservadas
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    local: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closeTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    totalPayments: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    ordersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    paymentSummary: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    productSummary: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    orders: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'CashRegisterHistory',
    timestamps: true
  });

  return CashRegisterHistory;
};