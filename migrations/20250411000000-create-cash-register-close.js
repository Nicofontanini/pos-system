'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CashRegisterCloses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      totalPayments: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      local: {
        type: Sequelize.STRING,
        allowNull: false
      },
      closeTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      productSummary: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      paymentSummary: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          efectivo: 0,
          transferencia: 0,
          mixto: 0,
          total: 0
        }
      },
      ordersCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      orders: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CashRegisterCloses');
  }
};