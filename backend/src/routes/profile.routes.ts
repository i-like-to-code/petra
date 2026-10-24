import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

// Protect all Profile routes with JWT authentication middleware
router.use(authenticateJwt);

/**
 * @route   GET /api/profile
 * @desc    Get user profile info
 * @access  Private
 */
router.get('/', (req, res, next) => profileController.getProfile(req, res, next));

/**
 * @route   PUT /api/profile
 * @desc    Update user profile info (fullName, phone)
 * @access  Private
 */
router.put('/', (req, res, next) => profileController.updateProfile(req, res, next));

/**
 * @route   PUT /api/profile/change-password
 * @desc    Change user password after verifying old password
 * @access  Private
 */
router.put('/change-password', (req, res, next) => profileController.changePassword(req, res, next));

/**
 * @route   GET /api/profile/addresses
 * @desc    Get all saved delivery addresses
 * @access  Private
 */
router.get('/addresses', (req, res, next) => profileController.getAddresses(req, res, next));

/**
 * @route   POST /api/profile/addresses
 * @desc    Add a new delivery address
 * @access  Private
 */
router.post('/addresses', (req, res, next) => profileController.addAddress(req, res, next));

/**
 * @route   PUT /api/profile/addresses/:id
 * @desc    Update an existing delivery address
 * @access  Private
 */
router.put('/addresses/:id', (req, res, next) => profileController.updateAddress(req, res, next));

/**
 * @route   DELETE /api/profile/addresses/:id
 * @desc    Delete a saved delivery address
 * @access  Private
 */
router.delete('/addresses/:id', (req, res, next) => profileController.deleteAddress(req, res, next));

export default router;
