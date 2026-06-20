const router = require('express').Router();
const c = require('../controllers/supplierController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.get('/', auth, authorize(['System Administrator', 'Business Coordinator']), c.getAll);
router.get('/:id', auth, authorize(['System Administrator', 'Business Coordinator']), c.getById);
router.post('/', auth, authorize(['System Administrator', 'Business Coordinator']), c.create);
router.put('/:id', auth, authorize(['System Administrator', 'Business Coordinator']), c.update);
router.delete('/:id', auth, authorize(['System Administrator', 'Business Coordinator']), c.delete);

module.exports = router;
