const express = require("express");
const router = express.Router();
const merchController = require("../controllers/merch.controller");
const uploadMerch = require('../middleware/uploadMerch.middleware');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

router.get("/artist/:artistId", merchController.getByArtist);
router.get("/search/:term", merchController.search);
router.get("/:id", merchController.getById);

router.post(
    "/",
    auth,
    admin,
    uploadMerch.fields([{ name: "image", maxCount: 1 }]),
    merchController.create
);

router.patch(
    "/:id",
    auth,
    admin,
    uploadMerch.fields([{ name: "image", maxCount: 1 }]),
    merchController.update
);

router.delete("/:id", auth, admin, merchController.remove);

module.exports = router;