const express = require("express");
const router = express.Router();
const radiosController = require("../controllers/radios.controller");
const uploadRadio = require('../middleware/uploadRadio.middleware');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

router.get("/decade/:decade", radiosController.getByDecade);
router.get("/search/:term", radiosController.search);
router.get("/:id", radiosController.getById);

router.post(
    "/",
    auth,
    admin,
    uploadRadio.fields([
        { name: "image", maxCount: 1 },
        { name: "titleimg", maxCount: 1 }
    ]),
    radiosController.create
);

router.patch(
    "/:id",
    auth,
    admin,
    uploadRadio.fields([
        { name: "image", maxCount: 1 },
        { name: "titleimg", maxCount: 1 }
    ]),
    radiosController.update
);

router.delete("/:id", auth, admin, radiosController.remove);

module.exports = router;