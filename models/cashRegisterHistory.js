// models/cashRegisterHistory.js
module.exports = (sequelize, DataTypes) => {
  const CashRegisterHistory = sequelize.define('CashRegisterHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
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
      allowNull: false
    },
    closeTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    totalPayments: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    ordersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    paymentSummary: {
      type: DataTypes.JSON,
      defaultValue: {
        efectivo: 0,
        transferencia: 0,
        mixto: 0,
        total: 0
      }
    },
    productSummary: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    orders: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    timestamps: true
  });

  return CashRegisterHistory;
};