const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
try {
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      dialect: 'postgres',
      port: config.port,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
  }
} catch (error) {
  console.error('Error al configurar Sequelize:', error);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    try {
      const modelDefiner = require(path.join(__dirname, file));
      let model;
      
      if (typeof modelDefiner === 'function' && !modelDefiner.init) {
        // Formato tradicional
        model = modelDefiner(sequelize, Sequelize.DataTypes);
      } else if (modelDefiner.init) {
        // Formato de clase
        model = modelDefiner.init(sequelize, Sequelize.DataTypes);
      } else {
        console.error(`Formato de modelo no reconocido en ${file}`);
        return;
      }
      
      db[model.name] = model;
    } catch (error) {
      console.error(`Error cargando modelo ${file}:`, error);
    }
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;