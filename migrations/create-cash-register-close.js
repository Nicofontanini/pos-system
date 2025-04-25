'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "CashRegisterHistories" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "date" TIMESTAMP NOT NULL,
        "totalPayments" INTEGER NOT NULL,
        "totalAmount" DECIMAL(10,2) NOT NULL,
        "local" VARCHAR(255) NOT NULL,
        "closeTime" TIMESTAMP NOT NULL,
        "startTime" TIMESTAMP NOT NULL,
        "productSummary" JSONB DEFAULT '[]',
        "paymentSummary" JSONB DEFAULT '{}',
        "ordersCount" INTEGER NOT NULL,
        "orders" JSONB DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
      );
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CashRegisterHistories');
  }
};