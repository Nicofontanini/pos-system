module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isCompound: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    components: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    local: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return Product;
};