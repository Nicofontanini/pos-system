// controllers/productController.js
const db = require('../models');
const Product = db.Product;

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
    const local = req.query.local || req.headers['x-local'];
    if (!local) {
      return res.status(400).json({ error: 'Local is required' });
    }

    const products = await Product.findAll({
      where: { local },
      attributes: ['id', 'name', 'price']
    });
    
    // Formatear los productos como un array simple
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) // Convertir a número
    }));
    
    res.json(formattedProducts);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const local = req.query.local || 'local1';
    const updatedProduct = req.body;

    const [updated] = await Product.update(updatedProduct, {
      where: { id: productId } // Use productId instead of id
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

exports.deleteProduct = async (req, res) => {
    try {
        const { id, local } = req.params;
        console.log(`Attempting to delete product ${id} from ${local}`); // Debug log

        const deleted = await Product.destroy({
            where: { 
                id: id,
                local: local
            }
        });

        if (deleted) {
            res.json({ success: true, message: 'Producto eliminado' });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Producto no encontrado',
                details: `Product ${id} in ${local} not found`
            });
        }
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};