const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config');

const ALLOWED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
// Hero backgrounds additionally accept video (mp4/webm/ogg/mov).
const ALLOWED_HERO = new Set([...ALLOWED_IMAGE, 'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);

const IMG_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg' };
const HERO_EXT = { ...IMG_EXT, 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/ogg': '.ogv', 'video/quicktime': '.mov' };

function mkUpload(dir, allowed, extMap, label) {
  fs.mkdirSync(dir, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      let ext = extMap[file.mimetype];
      if (!ext) { const m = (file.originalname || '').match(/\.(\w+)$/); ext = m ? '.' + m[1] : '.img'; }
      cb(null, crypto.randomBytes(8).toString('hex') + '-' + Date.now() + ext);
    },
  });
  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (allowed.has(file.mimetype)) return cb(null, true);
      cb(new Error('Invalid ' + label + ' type. Allowed: ' + [...allowed].join(', ')));
    },
    limits: { fileSize: config.upload.maxMb * 1024 * 1024 },
  });
}

const upload = mkUpload(config.upload.dir, ALLOWED_IMAGE, IMG_EXT, 'image');
const heroUpload = mkUpload(path.join(config.upload.dir, 'hero'), ALLOWED_HERO, HERO_EXT, 'file');

function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? `File too large. Maximum ${config.upload.maxMb}MB.` : err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
}

module.exports = { upload, heroUpload, handleUploadError };