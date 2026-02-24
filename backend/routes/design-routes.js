const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const designController = require('../controllers/design-controllers');

// Get all templates (public)
router.get('/templates', designController.getTemplates);

// Get templates by category (public)
router.get('/templates/categories', designController.getTemplatesByCategory);

// Get single template (public)
router.get('/templates/:templateId', designController.getTemplateById);

// Record template usage (authenticated)
router.post('/templates/:templateId/use', checkAuth, designController.useTemplate);

// Upload custom design (authenticated)
router.post(
  '/upload',
  checkAuth,
  designController.uploadCustomDesign,
  designController.saveCustomDesign
);

// Delete custom design (authenticated)
router.delete('/upload/:filename', checkAuth, designController.deleteCustomDesign);

// Create template (admin only - add admin middleware later)
router.post('/templates', checkAuth, designController.createTemplate);

module.exports = router;