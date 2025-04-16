// controllers/orderLocal2Controller.js
const { Orders2, Product } = require('../models');
const { Op } = require('sequelize');

exports.createOrder = async (req, res) => {
  try {
    const orderData = {
      date: new Date(),
      total: req.body.total,
      paymentMethod: req.body.paymentMethod,
      paymentAmounts: req.body.paymentAmounts,
      local: req.body.local,
      orderName: req.body.orderName,
      sellerName: req.body.sellerName,
      items: req.body.items || [],
      status: 'completed'
    };

    // Actualizar stock
    for (const item of orderData.items) {
      if (item.details && item.details.length > 0) {
        // Producto compuesto
        for (const component of item.details) {
          const componentProduct = await Product.findByPk(component.productId);
          if (!componentProduct) {
            throw new Error(`Component product with id ${component.productId} not found`);
          }
          
          const newStock = componentProduct.stock - component.quantity;
          if (newStock < 0) {
            throw new Error(`Insufficient stock for component ${componentProduct.name}`);
          }
          
          await componentProduct.update({ stock: newStock });
        }
      } else {
        // Producto simple
        const product = await Product.findByPk(item.id);
        if (!product) {
          throw new Error(`Product with id ${item.id} not found`);
        }
        
        const newStock = product.stock - item.quantity;
        if (newStock < 0) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }
        
        await product.update({ stock: newStock });
      }
    }

    const newOrder = await Orders2.create(orderData);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Error processing order'
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Orders2.findAll({
      order: [['date', 'DESC']] // Optional: order by date descending
    });
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const updates = req.body;
    
    const [updated] = await Orders2.update(updates, {
      where: { id: orderId }
    });
    
    if (updated) {
      const updatedOrder = await Orders2.findByPk(orderId);
      res.json(updatedOrder);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const deleted = await Orders2.destroy({
      where: { id: orderId }
    });
    
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.filterOrdersByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    const orders = await Orders2.findAll({
      where: {
        date: {
          [Op.gte]: new Date(startDate),
          [Op.lte]: new Date(endDate)
        }
      }
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error al filtrar órdenes:', error);
    res.status(500).json({ error: error.message });
  }
};
