import { Setting } from '../models/setting.model';

export type CommissionType = 'percent' | 'per_bag';

export interface CommissionSettings {
  type: CommissionType; // 'percent' of order value, or a fixed amount per bag
  value: number;
}

const COMMISSION_KEY = 'commission';
const DEFAULT_COMMISSION: CommissionSettings = { type: 'percent', value: 2 };

// Promotional banner on the mobile app's Home screen
export interface HomeBanner {
  badge: string; // small label, e.g. "BULK OFFER"
  title: string; // heading, e.g. "Save more on 100+ bags"
  buttonText: string;
}

const HOME_BANNER_KEY = 'homeBanner';
const DEFAULT_HOME_BANNER: HomeBanner = { badge: 'BULK OFFER', title: 'Save more on 100+ bags', buttonText: 'Order Now' };
// Kept short so the banner layout never breaks on small phones
export const HOME_BANNER_LIMITS: Record<keyof HomeBanner, number> = { badge: 20, title: 50, buttonText: 16 };
const HOME_BANNER_LABELS: Record<keyof HomeBanner, string> = { badge: 'badge', title: 'heading', buttonText: 'button text' };

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

export class SettingsService {
  async getCommissionSettings(): Promise<CommissionSettings> {
    const doc = await Setting.findOne({ key: COMMISSION_KEY });
    const v = doc?.value;
    if (v && (v.type === 'percent' || v.type === 'per_bag') && typeof v.value === 'number') {
      return { type: v.type, value: v.value };
    }
    return DEFAULT_COMMISSION;
  }

  async updateCommissionSettings(input: { type?: string; value?: any }): Promise<CommissionSettings> {
    if (input.type !== 'percent' && input.type !== 'per_bag') {
      throw createHttpError(400, "Commission type must be 'percent' or 'per_bag'.");
    }
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < 0) {
      throw createHttpError(400, 'Commission value must be a number of 0 or more.');
    }
    if (input.type === 'percent' && value > 100) {
      throw createHttpError(400, 'Commission percentage cannot exceed 100.');
    }
    const settings: CommissionSettings = { type: input.type, value };
    await Setting.findOneAndUpdate({ key: COMMISSION_KEY }, { value: settings }, { upsert: true });
    return settings;
  }

  async getHomeBanner(): Promise<HomeBanner> {
    const doc = await Setting.findOne({ key: HOME_BANNER_KEY });
    return { ...DEFAULT_HOME_BANNER, ...(doc?.value || {}) };
  }

  async updateHomeBanner(input: Partial<Record<keyof HomeBanner, any>>): Promise<HomeBanner> {
    const banner: HomeBanner = {
      badge: String(input.badge ?? '').trim(),
      title: String(input.title ?? '').trim(),
      buttonText: String(input.buttonText ?? '').trim(),
    };
    for (const [field, max] of Object.entries(HOME_BANNER_LIMITS) as [keyof HomeBanner, number][]) {
      if (!banner[field]) throw createHttpError(400, `Banner ${HOME_BANNER_LABELS[field]} is required.`);
      if (banner[field].length > max) {
        throw createHttpError(400, `Banner ${HOME_BANNER_LABELS[field]} must be ${max} characters or fewer.`);
      }
    }
    await Setting.findOneAndUpdate({ key: HOME_BANNER_KEY }, { value: banner }, { upsert: true });
    return banner;
  }

  /**
   * Commission earned for an order under the given settings
   */
  calculateCommission(settings: CommissionSettings, orderAmount: number, totalBags: number): number {
    const raw = settings.type === 'percent' ? (orderAmount * settings.value) / 100 : totalBags * settings.value;
    return Math.round(raw * 100) / 100;
  }
}

export const settingsService = new SettingsService();
