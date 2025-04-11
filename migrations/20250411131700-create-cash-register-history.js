'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('CashRegisterHistories'));

    if (!tableExists) {
      // Create table if it doesn't exist
      await queryInterface.createTable('CashRegisterHistories', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        date: {
          type: Sequelize.DATE,
          allowNull: true
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
          allowNull: true
        },
        paymentSummary: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        ordersCount: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        orders: {
          type: Sequelize.JSONB,
          allowNull: true
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
    } else {
      // Add columns if they don't exist
      await queryInterface.sequelize.query(
        `ALTER TABLE "CashRegisterHistories" 
        ADD COLUMN IF NOT EXISTS "date" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "totalPayments" INTEGER NOT NULL,
        ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(10,2) NOT NULL,
        ADD COLUMN IF NOT EXISTS "local" VARCHAR(255) NOT NULL,
        ADD COLUMN IF NOT EXISTS "closeTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        ADD COLUMN IF NOT EXISTS "productSummary" JSONB,
        ADD COLUMN IF NOT EXISTS "paymentSummary" JSONB,
        ADD COLUMN IF NOT EXISTS "ordersCount" INTEGER NOT NULL,
        ADD COLUMN IF NOT EXISTS "orders" JSONB,
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL`
      );

      // Update existing records with null dates
      await queryInterface.sequelize.query(
        `UPDATE "CashRegisterHistories" 
        SET "date" = NOW() 
        WHERE "date" IS NULL`
      );

      // Handle productSummary column conversion
      await queryInterface.sequelize.query(
        `ALTER TABLE "CashRegisterHistories" 
        ALTER COLUMN "productSummary" TYPE JSONB 
        USING "productSummary"::jsonb`
      );

      // Handle orders column conversion
      await queryInterface.sequelize.query(
        `ALTER TABLE "CashRegisterHistories" 
        ALTER COLUMN "orders" TYPE JSONB 
        USING "orders"::jsonb`
      );

      // Handle paymentSummary column conversion
      await queryInterface.sequelize.query(
        `ALTER TABLE "CashRegisterHistories" 
        ALTER COLUMN "paymentSummary" TYPE JSONB 
        USING "paymentSummary"::jsonb`
      );
    }
  },

  async down (queryInterface, Sequelize) {
    // Drop the date column if it exists
    await queryInterface.sequelize.query(
      `ALTER TABLE "CashRegisterHistories" 
      DROP COLUMN IF EXISTS "date"`
    );

    // Revert productSummary column type
    await queryInterface.sequelize.query(
      `ALTER TABLE "CashRegisterHistories" 
      ALTER COLUMN "productSummary" TYPE JSONB 
      USING "productSummary"::jsonb`
    );

    // Revert orders column type
    await queryInterface.sequelize.query(
      `ALTER TABLE "CashRegisterHistories" 
      ALTER COLUMN "orders" TYPE JSONB 
      USING "orders"::jsonb`
    );

    // Revert paymentSummary column type
    await queryInterface.sequelize.query(
      `ALTER TABLE "CashRegisterHistories" 
      ALTER COLUMN "paymentSummary" TYPE JSONB 
      USING "paymentSummary"::jsonb`
    );

    await queryInterface.dropTable('CashRegisterHistories');
  }
};
