module.exports = (sequelize, DataTypes) => {
  const Sellers = sequelize.define('Sellers', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    local: {
      type: DataTypes.STRING,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  return Sellers;
};