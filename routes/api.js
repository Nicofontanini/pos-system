const express = require('express');
const router = express.Router();
const db = require('../models');

// 5. Asegúrate de que la API esté devolviendo correctamente los componentes

Verifica la ruta API para obtener componentes:
```javascript
// Mejorar la ruta para obtener componentes de un producto
router.get('/product/:id/components', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log(`Buscando componentes para el producto ID: ${productId}`);
        
        // Obtener el producto
        const product = await db.Product.findByPk(productId);
        
        if (!product) {
            console.log(`Producto no encontrado: ${productId}`);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        console.log(`Producto encontrado: ${product.name}, isCompound: ${product.isCompound}`);
        
        // Si no es un producto compuesto o no tiene componentes, devolver array vacío
        if (!product.isCompound) {
            console.log('El producto no es compuesto');
            return res.json([]);
        }
        
        // Verificar si los componentes existen y son un array
        if (!product.components || !Array.isArray(product.components)) {
            console.log('El producto no tiene componentes o no son un array');
            return res.json([]);
        }
        
        console.log(`Componentes: ${JSON.stringify(product.components)}`);
        
        // Devolver los componentes del producto
        res.json(product.components);
    } catch (error) {
        console.error('Error al obtener componentes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
```

module.exports = router;