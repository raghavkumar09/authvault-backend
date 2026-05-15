const multer = require('multer');
const ApiError = require('../utils/ApiError');

const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(ApiError.badRequest('Only JPEG, PNG, and WebP images are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1,
    },
});

// Named upload middleware presets
const uploadAvatar = upload.single('avatar');

// Wrapper to convert multer errors into ApiError
const handleUpload = (uploadFn) => (req, res, next) => {
    uploadFn(req, res, (err) => {
        if (!err) return next();

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(ApiError.badRequest('File size exceeds the 5MB limit'));
            }
            return next(ApiError.badRequest(`Upload error: ${err.message}`));
        }
        next(err);
    });
};

module.exports = { uploadAvatar: handleUpload(uploadAvatar), upload };
