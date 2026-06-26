const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const recoverPassword = require('../middleware/recoverPassword.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/update-push-token', authController.updatePushToken);

router.post('/recover-password', authController.recoverPassword);
router.post('/verify-code', authController.verifyCode);
router.post('/change-password', recoverPassword, authController.changePassword);

module.exports = router;