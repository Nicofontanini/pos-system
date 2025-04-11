// controllers/orderLocal1Controller.js
const OrderLocal1 = require('../models/orderLocal1');
const db = require('../models');

exports.createOrder = async (req, res) => {
  try {
    const order = req.body;
    const newOrder = await OrderLocal1.create(order);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await OrderLocal1.findAll();
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
