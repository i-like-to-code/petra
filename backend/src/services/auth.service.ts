import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';
import { UserResponse, JwtPayload } from '../types/auth.types';

export class AuthService {
  /**
   * Find user document by email address
   */
  async findUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.trim().toLowerCase() });
  }

  /**
   * Find user document by email or phone number
   */
  async findUserByIdentifier(identifier: string): Promise<IUser | null> {
    const clean = identifier.trim().toLowerCase();
    return User.findOne({
      $or: [{ email: clean }, { phone: clean }],
    });
  }

  /**
   * Find user document by primary ObjectId
   */
  async findUserById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  /**
   * Create and save a new user document in MongoDB with hashed password
   */
  async createUser(fullName: string, email: string, phone: string, plainTextPassword: string, role: 'user' | 'agent' | 'admin' = 'user'): Promise<UserResponse> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainTextPassword, saltRounds);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      passwordHash,
      role,
    });

    return this.sanitizeUser(newUser);
  }

  /**
   * Create the initial admin account from ADMIN_EMAIL / ADMIN_PASSWORD if no admin exists yet
   */
  async seedAdminIfNeeded(): Promise<void> {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return;
    }

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      console.warn('[Seed] No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create one.');
      return;
    }

    if (await this.findUserByEmail(email)) {
      console.warn(`[Seed] ${email} already exists as a non-admin user; admin account not created.`);
      return;
    }

    await this.createUser('Administrator', email, process.env.ADMIN_PHONE || '0000000000', password, 'admin');
    console.log(`[Seed] Created admin account ${email}`);
  }

  /**
   * Reset user password in MongoDB
   */
  async resetPassword(identifier: string, plainTextPassword: string): Promise<UserResponse | null> {
    const userDoc = await this.findUserByIdentifier(identifier);
    if (!userDoc) {
      return null;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainTextPassword, saltRounds);

    userDoc.passwordHash = passwordHash;
    await userDoc.save();

    return this.sanitizeUser(userDoc);
  }

  /**
   * Securely compare candidate password with stored bcrypt hash
   */
  async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  /**
   * Generate JWT access token for authenticated user (including role)
   */
  generateToken(user: { id: string; email: string; role?: string }): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured in environment variables');
    }

    const options: jwt.SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d',
    };

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
    };

    return jwt.sign(payload, secret, options);
  }

  /**
   * Sanitize user document by excluding passwordHash
   */
  sanitizeUser(user: IUser): UserResponse {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role || 'user',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const authService = new AuthService();
