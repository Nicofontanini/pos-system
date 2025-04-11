'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update any existing records with null items to an empty array
    await queryInterface.sequelize.query(
      `UPDATE "Orders" 
      SET "items" = '[]'::jsonb 
      WHERE "items" IS NULL`
    );

    // Update any existing records with null paymentAmounts to an empty object
    await queryInterface.sequelize.query(
      `UPDATE "Orders" 
      SET "paymentAmounts" = '{}'::jsonb 
      WHERE "paymentAmounts" IS NULL`
    );
  },

  async down (queryInterface, Sequelize) {
    // If needed, we can revert the changes by setting back to NULL
    await queryInterface.sequelize.query(
      `UPDATE "Orders" 
      SET "items" = NULL 
      WHERE "items" = '[]'::jsonb`
    );

    await queryInterface.sequelize.query(
      `UPDATE "Orders" 
      SET "paymentAmounts" = NULL 
      WHERE "paymentAmounts" = '{}'::jsonb`
    );
  }
};
