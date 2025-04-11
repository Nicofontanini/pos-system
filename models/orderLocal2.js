module.exports = (sequelize, DataTypes) => {
  const OrderLocal2 = sequelize.define('OrderLocal2', {
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
    items: {
      type: DataTypes.JSON,
      allowNull: false
    },
    seller: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return OrderLocal2;
};