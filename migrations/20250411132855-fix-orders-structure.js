'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, update any existing records with null items to an empty array
    await queryInterface.sequelize.query(
      `UPDATE "Orders" 
      SET "items" = '{}'::jsonb[] 
      WHERE "items" IS NULL`
    );

    // Then, update any existing records with null paymentAmounts to an empty object
    await queryInterface.sequelize.query(
      `UPDATE "Orders" 
      SET "paymentAmounts" = '{}'::jsonb 
      WHERE "paymentAmounts" IS NULL`
    );

    // Add NOT NULL constraints
    await queryInterface.sequelize.query(
      `ALTER TABLE "Orders" 
      ALTER COLUMN "items" SET NOT NULL,
      ALTER COLUMN "paymentAmounts" SET NOT NULL`
    );
  },

  async down (queryInterface, Sequelize) {
    // Remove NOT NULL constraints
    await queryInterface.sequelize.query(
      `ALTER TABLE "Orders" 
      ALTER COLUMN "items" DROP NOT NULL,
      ALTER COLUMN "paymentAmounts" DROP NOT NULL`
    );

    // Revert the changes by setting back to NULL
    await queryInterface.sequelize.query(
      `UPDATE "Orders" 
      SET "items" = NULL 
      WHERE "items" = '{}'::jsonb[]`
    );

    await queryInterface.sequelize.query(
      `UPDATE "Orders" 
      SET "paymentAmounts" = NULL 
      WHERE "paymentAmounts" = '{}'::jsonb`
    );
  }
};
