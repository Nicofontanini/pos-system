// models/cashRegisterHistory.js
module.exports = (sequelize, DataTypes) => {
  const CashRegisterHistory = sequelize.define('CashRegisterHistory', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    totalPayments: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10,2),
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
      allowNull: true
    },
    paymentSummary: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ordersCount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    orders: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  });

  return CashRegisterHistory;
};