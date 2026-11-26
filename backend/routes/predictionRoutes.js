const router = require('express').Router();
const c = require('../controllers/predictionController');
const { auth, authorize } = require('../middleware/authMiddleware');

const allowedRoles = ['System Administrator', 'Business Coordinator'];

router.get('/', auth, authorize(allowedRoles), c.getPredictionSummary);
router.post('/run', auth, authorize(allowedRoles), c.runPredictionPipeline);

module.exports = router;
