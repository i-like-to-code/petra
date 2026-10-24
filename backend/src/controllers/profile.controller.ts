import { Response, NextFunction } from 'express';
import { profileService } from '../services/profile.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { CreateAddressDto, UpdateProfileDto, ChangePasswordDto } from '../types/profile.types';

export class ProfileController {
  /**
   * GET /api/profile
   * Get logged-in user profile details
   */
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await profileService.getProfile(userId);

      if (!profile) {
        res.status(404).json({ success: false, message: 'Profile not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile fetched successfully.',
        data: {
          user: profile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/profile
   * Update profile info (fullName, phone)
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto: UpdateProfileDto = req.body;

      const updatedUser = await profileService.updateProfile(userId, dto);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          user: updatedUser,
        },
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/profile/change-password
   * Change user password after verifying current password
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto: ChangePasswordDto = req.body;

      await profileService.changePassword(userId, dto);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully.',
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/profile/addresses
   * Get saved delivery addresses
   */
  async getAddresses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const addresses = await profileService.getAddresses(userId);

      res.status(200).json({
        success: true,
        message: 'Delivery addresses fetched successfully.',
        data: {
          addresses,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/profile/addresses
   * Add new delivery address
   */
  async addAddress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto: CreateAddressDto = req.body;

      if (!dto.fullName || !dto.phone || !dto.addressLine1 || !dto.city || !dto.state || !dto.pincode) {
        res.status(400).json({
          success: false,
          message: 'fullName, phone, addressLine1, city, state, and pincode are required.',
        });
        return;
      }

      const newAddress = await profileService.addAddress(userId, dto);

      res.status(201).json({
        success: true,
        message: 'Address added successfully.',
        data: {
          address: newAddress,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/profile/addresses/:id
   * Update an existing address
   */
  async updateAddress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const dto: Partial<CreateAddressDto> = req.body;

      const updatedAddress = await profileService.updateAddress(userId, id, dto);

      if (!updatedAddress) {
        res.status(404).json({ success: false, message: 'Address not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Address updated successfully.',
        data: {
          address: updatedAddress,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/profile/addresses/:id
   * Delete a saved address
   */
  async deleteAddress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const success = await profileService.deleteAddress(userId, id);

      if (!success) {
        res.status(404).json({ success: false, message: 'Address not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Address deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
