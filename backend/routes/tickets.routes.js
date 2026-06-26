const express = require("express");
const router = express.Router();
const ticketsController = require("../controllers/tickets.controller");
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

router.get("/search/:term", ticketsController.search);

router.post("/", auth, admin, ticketsController.create);

router.patch('/:id', auth, admin, ticketsController.update);

router.delete("/:id", auth, admin, ticketsController.remove);

module.exports = router;