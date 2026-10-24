import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { Address, IAddress } from '../models/address.model';
import { authService } from './auth.service';
import { UserResponse } from '../types/auth.types';
import {
  AddressResponse,
  CreateAddressDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from '../types/profile.types';

export class ProfileService {
  /**
   * Helper to resolve a valid MongoDB ObjectId for the user (supporting dev fallback)
   */
  async resolveUserId(userId?: string): Promise<mongoose.Types.ObjectId> {
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      return new mongoose.Types.ObjectId(userId);
    }
    const defaultUser = await User.findOne({ role: 'user' });
    if (defaultUser) return defaultUser._id as mongoose.Types.ObjectId;
    const anyUser = await User.findOne();
    if (anyUser) return anyUser._id as mongoose.Types.ObjectId;
    return new mongoose.Types.ObjectId();
  }

  /**
   * Format Address document into clean response object
   */
  sanitizeAddress(address: IAddress): AddressResponse {
    return {
      id: address._id.toString(),
      userId: address.user.toString(),
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }

  /**
   * Get user profile details
   */
  async getProfile(userId: string): Promise<UserResponse | null> {
    const validId = await this.resolveUserId(userId);
    const userDoc = await User.findById(validId);
    return userDoc ? authService.sanitizeUser(userDoc) : null;
  }

  /**
   * Update user profile info (fullName, phone)
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserResponse> {
    const validId = await this.resolveUserId(userId);
    const userDoc = await User.findById(validId);
    if (!userDoc) {
      const error: any = new Error('User profile not found.');
      error.statusCode = 404;
      throw error;
    }

    if (dto.fullName && dto.fullName.trim()) {
      userDoc.fullName = dto.fullName.trim();
    }
    if (dto.phone && dto.phone.trim()) {
      userDoc.phone = dto.phone.trim();
    }

    await userDoc.save();
    return authService.sanitizeUser(userDoc);
  }

  /**
   * Change user password after verifying current old password
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<boolean> {
    const validId = await this.resolveUserId(userId);
    const { oldPassword, newPassword, confirmNewPassword } = dto;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      const error: any = new Error('Old password, new password, and confirm new password are required.');
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error: any = new Error('New password must be at least 6 characters long.');
      error.statusCode = 400;
      throw error;
    }

    if (newPassword !== confirmNewPassword) {
      const error: any = new Error('New password and confirm new password do not match.');
      error.statusCode = 400;
      throw error;
    }

    const userDoc = await User.findById(validId);
    if (!userDoc) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, userDoc.passwordHash);
    if (!isOldPasswordCorrect) {
      const error: any = new Error('Incorrect current password.');
      error.statusCode = 400;
      throw error;
    }

    userDoc.passwordHash = await bcrypt.hash(newPassword, 10);
    await userDoc.save();
    return true;
  }

  /**
   * Get all saved delivery addresses for user
   */
  async getAddresses(userId: string): Promise<AddressResponse[]> {
    const validId = await this.resolveUserId(userId);
    const addresses = await Address.find({ user: validId }).sort({ isDefault: -1, createdAt: -1 });
    return addresses.map((a) => this.sanitizeAddress(a));
  }

  /**
   * Add a new delivery address
   */
  async addAddress(userId: string, dto: CreateAddressDto): Promise<AddressResponse> {
    const validId = await this.resolveUserId(userId);
    // If this address is set to default, unset previous default addresses
    if (dto.isDefault) {
      await Address.updateMany({ user: validId }, { isDefault: false });
    } else {
      // If user has no existing addresses, make this first address default automatically
      const count = await Address.countDocuments({ user: validId });
      if (count === 0) {
        dto.isDefault = true;
      }
    }

    const newAddress = await Address.create({
      user: validId,
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      addressLine1: dto.addressLine1.trim(),
      addressLine2: dto.addressLine2?.trim() || '',
      city: dto.city.trim(),
      state: dto.state.trim(),
      pincode: dto.pincode.trim(),
      isDefault: !!dto.isDefault,
    });

    return this.sanitizeAddress(newAddress);
  }

  /**
   * Update an existing address
   */
  async updateAddress(userId: string, addressId: string, dto: Partial<CreateAddressDto>): Promise<AddressResponse | null> {
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return null;
    }
    const validId = await this.resolveUserId(userId);
    const address = await Address.findOne({ _id: addressId, user: validId });
    if (!address) {
      return null;
    }

    if (dto.isDefault) {
      await Address.updateMany({ user: validId }, { isDefault: false });
      address.isDefault = true;
    }

    if (dto.fullName) address.fullName = dto.fullName.trim();
    if (dto.phone) address.phone = dto.phone.trim();
    if (dto.addressLine1) address.addressLine1 = dto.addressLine1.trim();
    if (dto.addressLine2 !== undefined) address.addressLine2 = dto.addressLine2.trim();
    if (dto.city) address.city = dto.city.trim();
    if (dto.state) address.state = dto.state.trim();
    if (dto.pincode) address.pincode = dto.pincode.trim();

    await address.save();
    return this.sanitizeAddress(address);
  }

  /**
   * Delete a saved address
   */
  async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return false;
    }

    const res = await Address.findOneAndDelete({ _id: addressId, user: userId });
    return !!res;
  }
}

export const profileService = new ProfileService();
