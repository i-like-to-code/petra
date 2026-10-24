import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest, SignupDto, LoginDto } from '../types/auth.types';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthController {
  /**
   * POST /api/auth/signup
   * Register a new user in MongoDB
   */
  async signup(req: Request<{}, {}, SignupDto>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fullName, email, phone, password, confirmPassword } = req.body;

      // 1. Validate required fields
      if (!fullName || !fullName.trim()) {
        res.status(400).json({ success: false, message: 'Full name is required.' });
        return;
      }
      if (!email || !email.trim()) {
        res.status(400).json({ success: false, message: 'Email address is required.' });
        return;
      }
      if (!phone || !phone.trim()) {
        res.status(400).json({ success: false, message: 'Phone number is required.' });
        return;
      }
      if (!password) {
        res.status(400).json({ success: false, message: 'Password is required.' });
        return;
      }
      if (!confirmPassword) {
        res.status(400).json({ success: false, message: 'Confirm password is required.' });
        return;
      }

      // 2. Validate email format
      const cleanEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(cleanEmail)) {
        res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        return;
      }

      // 3. Validate password length
      if (password.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        return;
      }

      // 4. Validate password confirmation match
      if (password !== confirmPassword) {
        res.status(400).json({ success: false, message: 'Password and confirm password do not match.' });
        return;
      }

      // 5. Check if email already exists
      const existingUser = await authService.findUserByEmail(cleanEmail);
      if (existingUser) {
        res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
        return;
      }

      // 6. Create user in MongoDB (Password hashed inside service)
      const user = await authService.createUser(fullName, cleanEmail, phone, password);

      // 7. Generate JWT access token
      const token = authService.generateToken({ id: user.id, email: user.email, role: user.role });

      // 8. Return success response
      res.status(201).json({
        success: true,
        message: 'User account created successfully.',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticate user against MongoDB and return JWT token
   */
  async login(req: Request<{}, {}, LoginDto>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const identifier = (email || (req.body as any).phone || '').trim();

      // 1. Validate required fields
      if (!identifier) {
        res.status(400).json({ success: false, message: 'Email or phone number is required.' });
        return;
      }
      if (!password) {
        res.status(400).json({ success: false, message: 'Password is required.' });
        return;
      }

      // 2. Check whether user exists in MongoDB by Email or Phone
      const userDoc = await authService.findUserByIdentifier(identifier);
      if (!userDoc) {
        res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email/phone and password.' });
        return;
      }

      // 3. Compare password securely using bcrypt
      const isPasswordValid = await authService.comparePassword(password, userDoc.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email/phone and password.' });
        return;
      }

      // 5. Generate JWT access token
      const token = authService.generateToken({ id: userDoc._id.toString(), email: userDoc.email, role: userDoc.role });

      // 6. Sanitize user data
      const user = authService.sanitizeUser(userDoc);

      // 7. Return success response
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get currently authenticated user profile from MongoDB
   */
  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const userDoc = await authService.findUserById(req.user.id);
      if (!userDoc) {
        res.status(404).json({ success: false, message: 'User profile not found.' });
        return;
      }

      const user = authService.sanitizeUser(userDoc);

      res.status(200).json({
        success: true,
        message: 'Authenticated user profile fetched successfully.',
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset user password in MongoDB by email or phone
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, email, phone, newPassword, password } = req.body;
      const targetIdentifier = (identifier || email || phone || '').trim();
      const targetPassword = (newPassword || password || '').trim();

      if (!targetIdentifier) {
        res.status(400).json({ success: false, message: 'Email or phone number is required.' });
        return;
      }

      if (!targetPassword || targetPassword.length < 6) {
        res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
        return;
      }

      // This route has no identity verification, so it must not be usable to take over privileged accounts
      const targetUser = await authService.findUserByIdentifier(targetIdentifier);
      if (targetUser && targetUser.role !== 'user') {
        res.status(403).json({ success: false, message: 'Password reset for this account must be done by an administrator.' });
        return;
      }

      const updatedUser = await authService.resetPassword(targetIdentifier, targetPassword);
      if (!updatedUser) {
        res.status(404).json({ success: false, message: 'No account found with the provided email/phone.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.',
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/google
   * Authenticate or register user via Google Sign-In
   */
  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, fullName, photoUrl } = req.body;

      if (!email || !email.trim()) {
        res.status(400).json({ success: false, message: 'Google email address is required.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const existingUser = await authService.findUserByEmail(cleanEmail);

      // The Google identity is not verified server-side, so never issue privileged tokens through this route
      if (existingUser && existingUser.role !== 'user') {
        res.status(403).json({ success: false, message: 'Please sign in with your email/phone and password.' });
        return;
      }

      let user: any = existingUser ? authService.sanitizeUser(existingUser) : null;

      if (!user) {
        const generatedName = fullName?.trim() || cleanEmail.split('@')[0];
        const defaultPassword = 'google_auth_' + Math.random().toString(36).substring(2, 12);
        user = await authService.createUser(
          generatedName,
          cleanEmail,
          req.body.phone?.trim() || '+91 98400 12345',
          defaultPassword,
          'user'
        );
      }

      const userId = user.id ? user.id.toString() : user._id ? user._id.toString() : '';
      const token = authService.generateToken({ id: userId, email: user.email, role: user.role });

      res.status(200).json({
        success: true,
        message: 'Google Sign-In successful.',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
