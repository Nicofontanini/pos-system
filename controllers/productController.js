// controllers/productController.js
const Product = require('../models/products');
const db = require('../models');

exports.createProduct = async (req, res) => {
  try {
    // Verificar que el contenido sea JSON
    if (!req.is('application/json')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Content-Type debe ser application/json' 
      });
    }
    
    const { local, ...productData } = req.body;
    
    // Validar datos requeridos
    if (!productData.name || !productData.price) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre y precio son requeridos' 
      });
    }
    
    const product = await Product.create({
      ...productData,
      local
    });
    
    res.set('Content-Type', 'application/json');
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).set('Content-Type', 'application/json');
    res.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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