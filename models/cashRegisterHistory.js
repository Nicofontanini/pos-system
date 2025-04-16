// models/cashRegisterHistory.js
module.exports = (sequelize, DataTypes) => {
  const CashRegisterHistory = sequelize.define('CashRegisterHistory', {
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    totalPayments: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    local: {
      type: DataTypes.STRING,
      allowNull: false
    },
    closeTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    productSummary: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    paymentSummary: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        efectivo: 0,
        transferencia: 0,
        mixto: 0,
        total: 0
      }
    },
    ordersCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    orders: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    }
  }, {
    tableName: 'CashRegisterHistories'
  });

  return CashRegisterHistory;
};