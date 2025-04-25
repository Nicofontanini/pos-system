'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('CashRegisterHistories', 'id', {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    });

    await queryInterface.changeColumn('CashRegisterHistories', 'paymentSummary', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.changeColumn('CashRegisterHistories', 'productSummary', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.changeColumn('CashRegisterHistories', 'orders', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes if needed
    await queryInterface.changeColumn('CashRegisterHistories', 'id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    });
  }
};