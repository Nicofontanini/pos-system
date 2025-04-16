const express = require('express');
const router = express.Router();

// Add this route handler for starting the cash register
router.post('/api/cash-register/start', async (req, res) => {
    try {
        const { startTime } = req.body;
        res.json({ 
            success: true, 
            message: 'Cash register started successfully',
            startTime 
        });
    } catch (error) {
        console.error('Error starting cash register:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

router.post('/api/cash-register/close', async (req, res) => {
    try {
        const closeData = req.body;
        // Guardar en la base de datos
        await db.CashRegister.create(closeData);
        res.json({ success: true });
    } catch (error) {
        console.error('Error al cerrar caja:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/api/cash-register/close/:local', async (req, res) => {
    try {
        const { local } = req.params;
        const history = await db.CashRegister.findAll({
            where: { local },
            order: [['closeTime', 'DESC']]
        });
        res.json(history);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;