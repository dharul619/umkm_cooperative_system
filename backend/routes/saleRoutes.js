const router = require('express').Router();
const c = require('../controllers/saleController');
const { auth, authorize } = require('../middleware/authMiddleware');

const POS_ROLES = ['System Administrator', 'Business Coordinator'];

// Static POS endpoints MUST come before /:id
router.get('/pos-products', auth, authorize(POS_ROLES), c.getPosProducts);
router.get('/members', auth, authorize(POS_ROLES), c.searchMembers);

// Shift endpoints (Blind Close)
router.get('/shifts/active', auth, authorize(POS_ROLES), c.getActiveShift);
router.get('/shifts', auth, authorize(POS_ROLES), c.getShiftHistory);
router.post('/shifts/open', auth, authorize(POS_ROLES), c.openShift);
router.post('/shifts/:id/close', auth, authorize(POS_ROLES), c.closeShift);

// Held / Parked Carts
router.get('/held-carts', auth, authorize(POS_ROLES), c.getHeldCarts);
router.post('/held-carts', auth, authorize(POS_ROLES), c.createHeldCart);
router.delete('/held-carts/:id', auth, authorize(POS_ROLES), c.deleteHeldCart);

// Sales CRUD + Void & Return
router.get('/', auth, authorize(['System Administrator']), c.getAll);
router.get('/lookup', auth, authorize(POS_ROLES), c.lookupByInvoice);
router.get('/:id', auth, authorize(POS_ROLES), c.getById);
router.post('/', auth, authorize(POS_ROLES), c.create);
router.post('/:id/void', auth, authorize(POS_ROLES), c.voidSale);
router.post('/:id/returns', auth, authorize(POS_ROLES), c.createReturn);

module.exports = router;
