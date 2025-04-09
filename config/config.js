// config/config.js
const { Sequelize, Op } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: 'dpg-cvqohr3e5dus73dlng20-a.oregon-postgres.render.com',
    username: 'empanadaskm11_user',
    password: 'ggoTBCwKMsgenfqKvyU9ATEPcBnxYcEa',
    database: 'empanadaskm11',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
sequelize.Op = Op; // Exportar el operador Op

module.exports = sequelize;