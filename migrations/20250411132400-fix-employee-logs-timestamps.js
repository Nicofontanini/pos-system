'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop createdAt and updatedAt columns if they exist
    await queryInterface.sequelize.query(
      `ALTER TABLE "EmployeeLogs" 
      DROP COLUMN IF EXISTS "createdAt",
      DROP COLUMN IF EXISTS "updatedAt"`
    );
  },

  async down (queryInterface, Sequelize) {
    // Add back the columns if needed
    await queryInterface.sequelize.query(
      `ALTER TABLE "EmployeeLogs" 
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL`
    );
  }
};
