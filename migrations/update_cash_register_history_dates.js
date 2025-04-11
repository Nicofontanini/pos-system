const { CashRegisterHistory } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First update any existing records with null dates
    await queryInterface.sequelize.query(
      `UPDATE "CashRegisterHistories" 
      SET "date" = NOW() 
      WHERE "date" IS NULL`
    );

    // Then add the NOT NULL constraint
    await queryInterface.changeColumn('CashRegisterHistories', 'date', {
      type: Sequelize.DATE,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the NOT NULL constraint if needed
    await queryInterface.changeColumn('CashRegisterHistories', 'date', {
      type: Sequelize.DATE,
      allowNull: true
    });
  }
};
