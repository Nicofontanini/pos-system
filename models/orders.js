module.exports = (sequelize, DataTypes) => {
  const Orders = sequelize.define('Orders', {
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
      allowNull: false
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
      allowNull: true
    }
  });

  return Orders;
};