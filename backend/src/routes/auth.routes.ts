import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/signup', (req, res, next) => authController.signup(req, res, next));

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
router.post('/login', (req, res, next) => authController.login(req, res, next));

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate or register user via Google Sign-In
 * @access  Public
 */
router.post('/google', (req, res, next) => authController.googleAuth(req, res, next));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password in MongoDB
 * @access  Public
 */
router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next));

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private (JWT Protected)
 */
router.get('/me', authenticateJwt, (req, res, next) => authController.me(req, res, next));

export default router;
