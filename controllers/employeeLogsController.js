// controllers/employeeLogsController.js
const EmployeeLogs = require('../models/employee_logs');
const { Op } = require('sequelize');
const db = require('../models');

exports.getEmployeeLogs = async (req, res) => {
  try {
    const logs = await EmployeeLogs.findAll({
      order: [['timestamp', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeLogsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const logs = await EmployeeLogs.findAll({
      where: {
        timestamp: {
          [Op.gte]: new Date(startDate),
          [Op.lte]: new Date(endDate)
        }
      },
      order: [['timestamp', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeLogsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const logs = await EmployeeLogs.findAll({
      where: { employeeId },
      order: [['timestamp', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logEmployeeAction = async (req, res) => {
    try {
        const { employeeName, action, local } = req.body;
        
        const log = await EmployeeLogs.create({
            employeeName,
            action,
            timestamp: new Date(),
            local
        });

        // Emitir el evento para actualizar en tiempo real
        req.app.io.emit('employee-log-updated', {
            employeeName,
            action,
            local
        });

        res.json({ 
            success: true, 
            message: `${action} registrado exitosamente` 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

exports.deleteEmployeeLogs = async (req, res) => {
  try {
    // Leer logs existentes
    let logs = await EmployeeLogs.findAll();
    
    // Filtrar logs por fecha (mantener solo los últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= thirtyDaysAgo;
    });
    
    // Eliminar logs antiguos
    await Promise.all(logs.filter(log => !filteredLogs.includes(log)).map(log => log.destroy()));
    
    res.json({ message: 'Old logs have been deleted' });
  } catch (error) {
    console.error('Error al eliminar registro de empleado:', error);
    res.status(500).json({ error: error.message });
  }
};
