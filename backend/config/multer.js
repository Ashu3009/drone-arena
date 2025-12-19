const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');
const path = require('path');

// File filter to accept only images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed! (jpeg, jpg, png, gif, webp)'));
  }
};

// Banner Storage - Cloudinary
const bannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'drone-arena/tournaments/banners',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 400, crop: 'limit', quality: 'auto' }]
  }
});

// Gallery Storage - Cloudinary
const galleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'drone-arena/tournaments/gallery',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }]
  }
});

// Man of Tournament Photo Storage - Cloudinary
const motStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'drone-arena/tournaments/mot',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto' }]
  }
});

// Team Member Photo Storage - Cloudinary
const memberPhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'drone-arena/teams/members',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }]
  }
});

// Configure multer instances
const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
});

const uploadGallery = multer({
  storage: galleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
});

const uploadMOT = multer({
  storage: motStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFilter
});

const uploadMemberPhoto = multer({
  storage: memberPhotoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
});

module.exports = {
  uploadBanner,
  uploadGallery,
  uploadMOT,
  uploadMemberPhoto
};
