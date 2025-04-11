'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, update any existing records with null employeeName
    await queryInterface.sequelize.query(
      `UPDATE "EmployeeLogs" 
      SET "employeeName" = 'Unknown' 
      WHERE "employeeName" IS NULL`
    );

    // Then, update any existing records with null action
    await queryInterface.sequelize.query(
      `UPDATE "EmployeeLogs" 
      SET "action" = 'Unknown' 
      WHERE "action" IS NULL`
    );

    // Then, update any existing records with null local
    await queryInterface.sequelize.query(
      `UPDATE "EmployeeLogs" 
      SET "local" = 'Unknown' 
      WHERE "local" IS NULL`
    );

    // Then, update any existing records with null timestamp
    await queryInterface.sequelize.query(
      `UPDATE "EmployeeLogs" 
      SET "timestamp" = NOW() 
      WHERE "timestamp" IS NULL`
    );
  },

  async down (queryInterface, Sequelize) {
    // If needed, we can revert the changes by setting back to NULL
    await queryInterface.sequelize.query(
      `UPDATE "EmployeeLogs" 
      SET "employeeName" = NULL 
      WHERE "employeeName" = 'Unknown'`
    );

    await queryInterface.sequelize.query(
      `UPDATE "EmployeeLogs" 
      SET "action" = NULL 
      WHERE "action" = 'Unknown'`
    );

    await queryInterface.sequelize.query(
      `UPDATE "EmployeeLogs" 
      SET "local" = NULL 
      WHERE "local" = 'Unknown'`
    );

    await queryInterface.sequelize.query(
      `UPDATE "EmployeeLogs" 
      SET "timestamp" = NULL 
      WHERE "timestamp" = NOW()`
    );
  }
};
