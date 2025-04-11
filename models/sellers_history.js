module.exports = (sequelize, DataTypes) => {
  const SellersHistory = sequelize.define('SellersHistory', {
    seller: {
      type: DataTypes.STRING,
      allowNull: true
    },
    oldName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    newName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    local: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: false
  });

  return SellersHistory;
};