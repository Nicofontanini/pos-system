'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create the Orders table if it doesn't exist
    await queryInterface.sequelize.query(
      `CREATE TABLE IF NOT EXISTS "Orders" (
        "orderId" SERIAL PRIMARY KEY,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "total" DECIMAL(10,2) NOT NULL,
        "status" VARCHAR(255) NOT NULL DEFAULT 'pending',
        "paymentMethod" VARCHAR(255) NOT NULL,
        "paymentAmounts" JSONB NOT NULL,
        "local" VARCHAR(255) NOT NULL,
        "orderName" VARCHAR(255) NOT NULL,
        "sellerName" VARCHAR(255) NOT NULL,
        "items" JSONB[] NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      )`
    );

    // Update any existing records with null items to an empty array
    await queryInterface.sequelize.query(
      `UPDATE "Orders" 
      SET "items" = '{}'::jsonb[] 
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
    // Drop the Orders table if it exists
    await queryInterface.sequelize.query(
      `DROP TABLE IF EXISTS "Orders"`
    );
  }
};
