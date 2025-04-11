// controllers/productController.js
const Product = require('../models/products');
const db = require('../models');

exports.createProduct = async (req, res) => {
  try {
    const { local, ...productData } = req.body;
    const product = await Product.create({
      ...productData,
      local
    });
    
    // Eliminar cualquier escritura en el archivo JSON
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const local = req.headers['x-local'];
    const products = await Product.findAll({
      where: { local }
    });
    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const local = req.query.local || 'local1';
    const updatedProduct = req.body;

    const [updated] = await Product.update(updatedProduct, {
      where: { id: productId, local }
    });

    if (updated) {
      const product = await Product.findByPk(productId);
      res.json({ success: true, product });
    } else {
      res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};