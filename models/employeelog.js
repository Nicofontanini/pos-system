module.exports = (sequelize, DataTypes) => {
  const EmployeeLogs = sequelize.define('EmployeeLogs', {
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    local: {
      type: DataTypes.STRING,
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  return EmployeeLogs;
};