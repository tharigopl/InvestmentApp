// backend/middleware/file-upload.js - COMPLETE FILE UPLOAD CONFIGURATION
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// STORAGE CONFIGURATION
// ============================================

// Configure multer storage for different file types
const createStorage = (uploadType) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadDir;
      
      switch (uploadType) {
        case 'profile':
          uploadDir = path.join(__dirname, '../uploads/profile-pictures');
          break;
        case 'event':
          uploadDir = path.join(__dirname, '../uploads/event-images');
          break;
        case 'documents':
          uploadDir = path.join(__dirname, '../uploads/documents');
          break;
        default:
          uploadDir = path.join(__dirname, '../uploads/general');
      }
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Create unique filename: userId-timestamp-random-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-');
      
      // Include userId if available (from auth middleware)
      const userId = req.userData?.userId || 'anonymous';
      cb(null, `${userId}-${uniqueSuffix}-${sanitizedName}${ext}`);
    }
  });
};

// ============================================
// FILE FILTERS
// ============================================

// Image files only
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP, SVG) are allowed.'), false);
  }
};

// Document files
const documentFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only documents (PDF, Word, Excel, TXT, CSV) are allowed.'), false);
  }
};

// Any file type
const anyFileFilter = (req, file, cb) => {
  cb(null, true);
};

// ============================================
// MULTER UPLOAD INSTANCES
// ============================================

// Profile picture upload (images only, max 5MB)
const uploadProfilePicture = multer({
  storage: createStorage('profile'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: imageFileFilter,
});

// Event image upload (images only, max 10MB)
const uploadEventImage = multer({
  storage: createStorage('event'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: imageFileFilter,
});

// Document upload (documents only, max 10MB)
const uploadDocument = multer({
  storage: createStorage('documents'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: documentFileFilter,
});

// General upload (any file, max 20MB)
const uploadGeneral = multer({
  storage: createStorage('general'),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: anyFileFilter,
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Delete a file from the filesystem
 * @param {string} filePath - Relative or absolute path to file
 * @returns {boolean} - Success status
 */
const deleteFile = (filePath) => {
  try {
    let absolutePath;
    
    // If path starts with /, it's a URL path like /uploads/profile-pictures/file.jpg
    if (filePath.startsWith('/')) {
      absolutePath = path.join(__dirname, '../', filePath);
    } else {
      absolutePath = filePath;
    }
    
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`✅ Deleted file: ${absolutePath}`);
      return true;
    } else {
      console.log(`⚠️ File not found: ${absolutePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting file: ${filePath}`, error);
    return false;
  }
};

/**
 * Delete multiple files
 * @param {string[]} filePaths - Array of file paths
 * @returns {object} - Results object with success count
 */
const deleteFiles = (filePaths) => {
  const results = {
    deleted: 0,
    failed: 0,
    errors: []
  };
  
  filePaths.forEach(filePath => {
    const success = deleteFile(filePath);
    if (success) {
      results.deleted++;
    } else {
      results.failed++;
      results.errors.push(filePath);
    }
  });
  
  return results;
};

/**
 * Get file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate file extension
 * @param {string} filename - Name of the file
 * @param {string[]} allowedExtensions - Array of allowed extensions (e.g., ['.jpg', '.png'])
 * @returns {boolean} - Whether file extension is valid
 */
const isValidExtension = (filename, allowedExtensions) => {
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
};

/**
 * Get file info
 * @param {string} filePath - Path to the file
 * @returns {object} - File information
 */
const getFileInfo = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      extension: path.extname(filePath),
      filename: path.basename(filePath),
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
};

// ============================================
// ERROR HANDLER MIDDLEWARE
// ============================================

/**
 * Multer error handler middleware
 * Use this after routes that use multer uploads
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          message: 'File too large',
          error: `Maximum file size exceeded. Please upload a smaller file.`,
          maxSize: formatFileSize(err.limit)
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          message: 'Too many files',
          error: `Maximum ${err.limit} files allowed.`
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          message: 'Unexpected field',
          error: `Unexpected file field: ${err.field}`
        });
      default:
        return res.status(400).json({
          message: 'Upload error',
          error: err.message
        });
    }
  } else if (err) {
    // Other errors (like file filter errors)
    return res.status(400).json({
      message: 'Upload failed',
      error: err.message
    });
  }
  
  next();
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Upload instances
  uploadProfilePicture,
  uploadEventImage,
  uploadDocument,
  uploadGeneral,
  
  // Utility functions
  deleteFile,
  deleteFiles,
  formatFileSize,
  isValidExtension,
  getFileInfo,
  
  // Middleware
  handleMulterError,
  
  // For custom configurations
  createStorage,
  imageFileFilter,
  documentFileFilter,
  anyFileFilter,
};