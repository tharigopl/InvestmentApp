const DesignTemplate = require('../models/design-template');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========================================
// GET ALL TEMPLATES
// ========================================

/**
 * Get all design templates
 * GET /api/designs/templates
 * Query: ?category=birthday&isPremium=false
 */
exports.getTemplates = async (req, res) => {
  try {
    const { category, isPremium } = req.query;
    console.log("DesignTemplate GetTemplates ", category, isPremium);
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (isPremium !== undefined) {
      filter.isPremium = isPremium === 'true';
    }
    console.log("DesignTemplate GetTemplates Filter ", filter);
    const templates = await DesignTemplate.find(filter)
      .sort({ usageCount: -1, createdAt: -1 });
    
    res.status(200).json({
      templates,
      total: templates.length,
    });
    
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ message: 'Failed to get templates' });
  }
};

// ========================================
// GET TEMPLATES BY CATEGORY
// ========================================

/**
 * Get templates grouped by category
 * GET /api/designs/templates/categories
 */
exports.getTemplatesByCategory = async (req, res) => {
  try {
    const categories = [
      'birthday',
      'wedding',
      'graduation',
      'baby_shower',
      'anniversary',
      'housewarming',
      'general',
    ];
    
    const templatesByCategory = {};
    
    for (const category of categories) {
      const templates = await DesignTemplate.find({
        category,
        isActive: true,
      })
      .limit(10)
      .sort({ usageCount: -1 });
      
      if (templates.length > 0) {
        templatesByCategory[category] = templates;
      }
    }
    
    res.status(200).json(templatesByCategory);
    
  } catch (error) {
    console.error('Error getting templates by category:', error);
    res.status(500).json({ message: 'Failed to get templates' });
  }
};

// ========================================
// GET TEMPLATE BY ID
// ========================================

/**
 * Get single template
 * GET /api/designs/templates/:templateId
 */
exports.getTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const template = await DesignTemplate.findById(templateId);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.status(200).json({ template });
    
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ message: 'Failed to get template' });
  }
};

// ========================================
// CREATE TEMPLATE (ADMIN ONLY)
// ========================================

/**
 * Create new design template
 * POST /api/designs/templates
 * Note: Add admin middleware in routes
 */
exports.createTemplate = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      imageUrl,
      thumbnailUrl,
      colors,
      isPremium,
      tags,
    } = req.body;
    
    const template = new DesignTemplate({
      name,
      category,
      description,
      imageUrl,
      thumbnailUrl,
      colors,
      isPremium: isPremium || false,
      tags: tags || [],
    });
    
    await template.save();
    
    res.status(201).json({
      message: 'Template created successfully',
      template,
    });
    
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Failed to create template' });
  }
};

// ========================================
// UPDATE TEMPLATE USAGE
// ========================================

/**
 * Increment template usage count
 * POST /api/designs/templates/:templateId/use
 */
exports.useTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const template = await DesignTemplate.findByIdAndUpdate(
      templateId,
      { $inc: { usageCount: 1 } },
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.status(200).json({
      message: 'Template usage recorded',
      template,
    });
    
  } catch (error) {
    console.error('Error updating template usage:', error);
    res.status(500).json({ message: 'Failed to update template usage' });
  }
};

// ========================================
// UPLOAD CUSTOM DESIGN
// ========================================

// Ensure upload directory exists
const uploadsDir = 'uploads/designs';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'design-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  },
});

exports.uploadCustomDesign = upload.single('design');

/**
 * Save custom design upload
 * POST /api/designs/upload
 */
exports.saveCustomDesign = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const imageUrl = `/uploads/designs/${req.file.filename}`;
    
    res.status(200).json({
      message: 'Design uploaded successfully',
      imageUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
    
  } catch (error) {
    console.error('Error uploading design:', error);
    res.status(500).json({ message: 'Failed to upload design' });
  }
};

// ========================================
// DELETE CUSTOM DESIGN
// ========================================

/**
 * Delete uploaded design file
 * DELETE /api/designs/upload/:filename
 */
exports.deleteCustomDesign = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security: Only allow deleting from uploads/designs
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Delete file
    fs.unlinkSync(filePath);
    
    res.status(200).json({
      message: 'Design deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ message: 'Failed to delete design' });
  }
};