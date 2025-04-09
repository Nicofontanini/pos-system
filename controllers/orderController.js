// controllers/orderController.js
const Order = require('../models/order');
const CashRegisterHistory = require('../models/cashRegisterHistory');

exports.createOrder = async (req, res) => {
  try {
    const order = req.body;
    const newOrder = await Order.create(order);
    res.json(newOrder);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const local = req.headers['x-local'];
    const orders = await Order.findAll({
      where: { local }
    });
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.closeCashRegister = async (req, res) => {
  try {
    const { local, totalAmount, paymentMethod } = req.body;

    // Guardar en historial de caja
    await CashRegisterHistory.create({
      local,
      totalAmount,
      paymentMethod
    });

    // Actualizar última fecha de cierre
    lastCashRegisterClose[local] = new Date().toISOString();

    res.json({ success: true });
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.filterCashRegisterHistory = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const history = await CashRegisterHistory.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(history);
  } catch (error) {
    console.error('Error al filtrar historial:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.cleanOldData = async (req, res) => {
  try {
    const local = req.headers['x-local'];
    
    // Calcular fecha límite (5 días atrás)
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 5);

    // Eliminar órdenes antiguas
    await Order.destroy({
      where: {
        local,
        date: { [Op.lt]: limitDate }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al limpiar datos:', error);
    res.status(500).json({ error: error.message });
  }
};