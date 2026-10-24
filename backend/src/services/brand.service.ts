import { Brand, IBrand } from '../models/brand.model';
import { Product } from '../models/product.model';

export const INITIAL_BRANDS_SEED = [
  {
    id: 'ultratech',
    name: 'UltraTech Cement',
    company: 'UltraTech Cement Ltd',
    tagline: "The Engineer's Choice",
    brandColor: '#ca8a04',
    bgLightColor: '#fefce8',
    image: '/cements/ultratech-super-ppc.png',
    active: true,
    productCount: 4,
  },
  {
    id: 'ramco',
    name: 'Ramco Cement',
    company: 'The Ramco Cements Ltd',
    tagline: 'As strong as family bonds',
    brandColor: '#d97706',
    bgLightColor: '#fffbeb',
    image: '/cements/ramco-supergrade.png',
    active: true,
    productCount: 4,
  },
  {
    id: 'dalmia',
    name: 'Dalmia Cement',
    company: 'Dalmia Bharat Limited',
    tagline: 'Future-ready green cement',
    brandColor: '#2563eb',
    bgLightColor: '#eff6ff',
    image: '/cements/dalmia-dsp.png',
    active: true,
    productCount: 3,
  },
  {
    id: 'jsw',
    name: 'JSW Cement',
    company: 'JSW Group',
    tagline: 'Building a Stronger India',
    brandColor: '#1d4ed8',
    bgLightColor: '#f0f9ff',
    image: '/cements/jsw-concreel-hd.png',
    active: true,
    productCount: 3,
  },
  {
    id: 'zuari',
    name: 'Zuari Cement',
    company: 'Italcementi Group',
    tagline: 'European cement quality',
    brandColor: '#0f172a',
    bgLightColor: '#f8fafc',
    image: '/cements/zuari-ppc.png',
    active: true,
    productCount: 2,
  },
  {
    id: 'maha',
    name: 'Maha Cement',
    company: 'My Home Industries Pvt Ltd',
    tagline: 'Build It Strong',
    brandColor: '#dc2626',
    bgLightColor: '#fef2f2',
    image: '/cements/maha-bag.png',
    active: true,
    productCount: 2,
  },
];

export class BrandService {
  async seedBrandsIfNeeded(): Promise<void> {
    const count = await Brand.countDocuments();
    if (count === 0) {
      console.log('[BrandService] Seeding 6 primary cement brands into MongoDB...');
      await Brand.insertMany(INITIAL_BRANDS_SEED);
      console.log('[BrandService] Brands seeded successfully.');
    }
  }

  async getAllBrands(includeInactive: boolean = false): Promise<any[]> {
    const filter = includeInactive ? {} : { active: true };
    const brands = await Brand.find(filter).lean();
    
    // Dynamically calculate product count for each brand
    const counts = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$brandId', count: { $sum: 1 } } }
    ]);
    const countMap: Record<string, number> = {};
    counts.forEach((c) => {
      if (c._id) countMap[c._id.toLowerCase()] = c.count;
    });

    return brands.map((b) => ({
      id: b.id,
      name: b.name,
      company: b.company,
      tagline: b.tagline,
      brandColor: b.brandColor,
      bgLightColor: b.bgLightColor,
      image: b.image,
      active: b.active,
      productCount: countMap[b.id.toLowerCase()] || b.productCount || 0,
    }));
  }

  async getBrandById(id: string): Promise<IBrand | null> {
    return Brand.findOne({ id }).exec();
  }

  async toggleBrandVisibility(id: string, active?: boolean): Promise<IBrand | null> {
    const brand = await Brand.findOne({ id }).exec();
    if (!brand) return null;

    brand.active = typeof active === 'boolean' ? active : !brand.active;
    await brand.save();

    console.log(`[BrandService] Brand "${brand.name}" (${brand.id}) set active: ${brand.active}`);
    return brand;
  }

  async updateBrand(id: string, updates: Partial<IBrand>): Promise<IBrand | null> {
    const brand = await Brand.findOneAndUpdate({ id }, { $set: updates }, { new: true }).exec();
    return brand;
  }

  async createBrand(brandData: Partial<IBrand>): Promise<IBrand> {
    const id = brandData.id || brandData.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || String(Date.now());
    const brand = new Brand({
      ...brandData,
      id,
    });
    return brand.save();
  }
}

export const brandService = new BrandService();
