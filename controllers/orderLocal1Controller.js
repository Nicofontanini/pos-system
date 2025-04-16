// controllers/orderLocal1Controller.js
const { Orders, Product } = require('../models');
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

    const newOrder = await Orders.create(orderData);
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
    const orders = await Orders.findAll({
      order: [['date', 'DESC']] // Order by date, newest first
    });
    
    console.log('Retrieved orders:', orders.length); // Debug log
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const updates = req.body;
    
    const [updated] = await OrderLocal1.update(updates, {
      where: { id: orderId }
    });
    
    if (updated) {
      const updatedOrder = await OrderLocal1.findByPk(orderId);
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
    const deleted = await OrderLocal1.destroy({
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
    
    const orders = await OrderLocal1.findAll({
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
