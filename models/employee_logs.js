module.exports = (sequelize, DataTypes) => {
  const EmployeeLog = sequelize.define('EmployeeLog', {
    employeeName: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: true
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
      allowNull: false
    }
  }, {
    timestamps: false // Prevent Sequelize from automatically adding createdAt and updatedAt columns
  });

  return EmployeeLog;
};
