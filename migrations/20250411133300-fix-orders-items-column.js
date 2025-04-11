'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero verificar si la columna ya existe
    const tableInfo = await queryInterface.describeTable('Orders');
    
    if (!tableInfo.items) {
      // Si no existe, crear la columna permitiendo valores nulos inicialmente
      await queryInterface.addColumn('Orders', 'items', {
        type: Sequelize.JSONB,
        allowNull: true
      });

      // Actualizar registros existentes con array vacío
      await queryInterface.sequelize.query(
        `UPDATE "Orders" SET "items" = '[]'::jsonb WHERE "items" IS NULL`
      );

      // Finalmente hacer la columna NOT NULL
      await queryInterface.changeColumn('Orders', 'items', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      });
    } else {
      // Si ya existe, actualizar los nulos
      await queryInterface.sequelize.query(
        `UPDATE "Orders" SET "items" = '[]'::jsonb WHERE "items" IS NULL`
      );
      
      // Añadir restricción NOT NULL
      await queryInterface.changeColumn('Orders', 'items', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      });
    }
  },

  async down(queryInterface) {
    // Revertir los cambios
    await queryInterface.changeColumn('Orders', 'items', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  }
};
