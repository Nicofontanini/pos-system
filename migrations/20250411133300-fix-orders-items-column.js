module.exports = {
  async up(queryInterface, Sequelize) {
    // First check if the column exists
    const tableInfo = await queryInterface.describeTable('Orders');
    if (!tableInfo.items) {
      // Only add the column if it doesn't exist
      await queryInterface.addColumn('Orders', 'items', {
        type: Sequelize.ARRAY(Sequelize.JSON),
        allowNull: true
      });
    } else {
      // If column exists, just modify its type
      await queryInterface.changeColumn('Orders', 'items', {
        type: Sequelize.ARRAY(Sequelize.JSON),
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert the changes
    await queryInterface.changeColumn('Orders', 'items', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  }
};
