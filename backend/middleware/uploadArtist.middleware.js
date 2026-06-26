const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/artists_img/');
    },
    filename: (req, file, cb) => {
        const sanitizedName = file.originalname.replace(/\s+/g, '-');
        
        cb(null, Date.now() + '-' + sanitizedName);
    }
});

const upload = multer({ storage });

module.exports = upload;