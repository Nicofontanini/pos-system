'use strict';

const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Primero, eliminar la tabla si existe
    await queryInterface.dropTable('Orders');

    // Crear la tabla con la estructura correcta
    await queryInterface.createTable('Orders', {
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      total: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending'
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false
      },
      paymentAmounts: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      },
      local: {
        type: DataTypes.STRING,
        allowNull: false
      },
      orderName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      sellerName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      items: {
        type: DataTypes.ARRAY(DataTypes.JSON),
        allowNull: false,
        defaultValue: []
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Orders');
  }
};
