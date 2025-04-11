'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero crear la columna permitiendo nulos
    await queryInterface.addColumn('Orders', 'items', {
      type: Sequelize.JSONB,
      allowNull: true
    });
    
    // Luego actualizar los nulos con array vacío
    await queryInterface.sequelize.query(
      `UPDATE "Orders" SET "items" = '[]'::jsonb WHERE "items" IS NULL`
    );
    
    // Finalmente hacer la columna NOT NULL
    await queryInterface.changeColumn('Orders', 'items', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Orders', 'items');
  }
};
