const express = require('express');
const router = express.Router();

const auth = require("../middleware/auth.middleware")
const upload = require('../middleware/upload.middleware');
const controller = require('../controllers/user.controller');

router.get('/me', auth, controller.getProfile);
router.get('/:id', controller.getPublicProfile);

router.post(
    '/profile-image',
    auth,
    upload.single('image'),
    controller.updateProfileImage
);

router.patch('/me', auth, controller.updateUser);

router.delete('/profile-image', auth, controller.removeProfileImage);
router.delete("/me", auth, controller.deleteAccount);

module.exports = router;