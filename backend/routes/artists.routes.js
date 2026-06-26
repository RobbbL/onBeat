const express = require("express");
const router = express.Router();
const artistsController = require("../controllers/artists.controller");
const uploadArtist = require('../middleware/uploadArtist.middleware');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

router.get('/top', artistsController.getTopArtists);
router.get("/search/:term", artistsController.search);
router.get("/decade/:decade", artistsController.getByDecade);
router.get('/is-liked/:artistId', auth, artistsController.checkIfLiked);
router.get("/:id", artistsController.getById);

router.post(
  "/",
  auth,
  admin,
  uploadArtist.fields([
    { name: "image", maxCount: 1 },
    { name: "titleimg", maxCount: 1 }
  ]),
  artistsController.create
);
router.post('/like', auth, artistsController.addLike);
router.post('/unlike', auth, artistsController.removeLike);

router.patch(
  '/:id',
  auth,
  admin,
  uploadArtist.fields([
    { name: "image", maxCount: 1 },
    { name: "titleimg", maxCount: 1 }
  ]),
  artistsController.update
);
router.delete("/:id", 
  auth,
  admin,
  artistsController.remove);

module.exports = router;