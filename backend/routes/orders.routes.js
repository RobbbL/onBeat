const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const orderController = require('../controllers/orders.controller');

router.post('/create', orderController.createOrder);
router.get('/user-orders', auth, orderController.getUserOrders);

module.exports = router;