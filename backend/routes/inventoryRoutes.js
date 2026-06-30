const router = require('express').Router();
const c = require('../controllers/inventoryController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.get('/stocks', auth, authorize(['System Administrator', 'Business Coordinator']), c.getStockSummary);
router.get('/stocks/:productId', auth, authorize(['System Administrator', 'Business Coordinator']), c.getStockCard);
router.post('/beginning', auth, authorize(['System Administrator', 'Business Coordinator']), c.createBeginningStock);
router.post('/adjustment', auth, authorize(['System Administrator', 'Business Coordinator']), c.createAdjustment);

module.exports = router;
