'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero verificamos si la columna existe
    const tableInfo = await queryInterface.describeTable('Orders');
    
    if (!tableInfo.items) {
      // Solo crear la columna si no existe
      await queryInterface.addColumn('Orders', 'items', {
        type: Sequelize.JSONB,
        allowNull: true
      });
      
      // Actualizar los nulos con array vacío
      await queryInterface.sequelize.query(
        `UPDATE "Orders" SET "items" = '[]'::jsonb WHERE "items" IS NULL`
      );
      
      // Hacer la columna NOT NULL
      await queryInterface.changeColumn('Orders', 'items', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('Orders');
    if (tableInfo.items) {
      await queryInterface.removeColumn('Orders', 'items');
    }
  }
};
