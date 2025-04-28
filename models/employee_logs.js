const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeLog extends Model {
    static associate(models) {
      // define associations here if needed
    }
  }
  
  EmployeeLog.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    local: {
      type: DataTypes.STRING,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'EmployeeLog',
    tableName: 'EmployeeLogs'
  });

  return EmployeeLog;
};
