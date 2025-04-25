'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CashRegisterHistories', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
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
        type: Sequelize.DECIMAL(10,2),
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
        defaultValue: {}
      },
      ordersCount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      orders: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CashRegisterHistories');
  }
};