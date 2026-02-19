// backend/routes/contacts-routes.js
const express = require('express');
const { check } = require('express-validator');
const contactsControllers = require('../controllers/contacts-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// All routes require authentication
router.use(checkAuth);

/**
 * @route   GET /api/contacts
 * @desc    Get all contacts for current user
 * @access  Private
 */
router.get('/', contactsControllers.getContacts);

/**
 * @route   GET /api/contacts/:contactId
 * @desc    Get single contact by ID
 * @access  Private
 */
router.get('/:contactId', contactsControllers.getContactById);

/**
 * @route   POST /api/contacts
 * @desc    Add new contact (or add user as friend if email exists)
 * @access  Private
 */
router.post(
  '/',
  [
    check('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    check('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    check('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
  ],
  contactsControllers.createContact
);

/**
 * @route   PATCH /api/contacts/:contactId
 * @desc    Update contact information
 * @access  Private
 */
router.patch(
  '/:contactId',
  [
    check('firstName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('First name cannot be empty'),
    check('lastName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Last name cannot be empty'),
    check('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
  ],
  contactsControllers.updateContact
);

/**
 * @route   DELETE /api/contacts/:contactId
 * @desc    Delete contact
 * @access  Private
 */
router.delete('/:contactId', contactsControllers.deleteContact);

/**
 * @route   POST /api/contacts/:contactId/invite
 * @desc    Send invitation to contact to join the app
 * @access  Private
 */
router.post('/:contactId/invite', contactsControllers.inviteContact);

/**
 * @route   POST /api/contacts/bulk
 * @desc    Bulk import contacts
 * @access  Private
 */
router.post(
  '/bulk',
  [
    check('contacts')
      .isArray({ min: 1 })
      .withMessage('Please provide an array of contacts')
  ],
  contactsControllers.bulkCreateContacts
);

module.exports = router;