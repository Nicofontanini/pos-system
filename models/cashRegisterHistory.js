// models/cashRegisterHistory.js
module.exports = (sequelize, DataTypes) => {
  const CashRegisterHistory = sequelize.define('CashRegisterHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    totalSales: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    cashInDrawer: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    difference: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    totalPayments: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    ordersCount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    paymentSummary: {
      type: DataTypes.JSON,
      allowNull: true
    },
    productSummary: {
      type: DataTypes.JSON,
      allowNull: true
    },
    orders: {
      type: DataTypes.JSON,
      allowNull: true
    }
  });

  return CashRegisterHistory;
};