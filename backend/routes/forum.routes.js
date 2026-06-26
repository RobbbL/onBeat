const express = require('express');
const router = express.Router();
const path = require('path');

const ForumController = require('../controllers/forum.controller.js');
const auth = require('../middleware/auth.middleware.js');
const admin = require('../middleware/admin.middleware');

router.get('/:category', ForumController.getPostsByDecade);

router.post('/', auth, ForumController.createPost);

router.delete('/:id', auth, admin, ForumController.deletePost);

module.exports = router;