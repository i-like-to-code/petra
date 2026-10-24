import { Banner, IBanner } from '../models/banner.model';
import { Category, ICategory } from '../models/category.model';
import { Product, IProduct } from '../models/product.model';
import { User } from '../models/user.model';
import { authService } from './auth.service';
import {
  BannerResponse,
  CategoryResponse,
  ProductResponse,
  ProductQuery,
  PaginatedProductsResponse,
  HomeScreenData,
} from '../types/home.types';

export class HomeService {
  /**
   * Format Banner document into clean response shape
   */
  sanitizeBanner(banner: IBanner): BannerResponse {
    return {
      id: banner._id.toString(),
      title: banner.title,
      description: banner.description,
      image: banner.image,
      status: banner.status,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    };
  }

  /**
   * Format Category document into clean response shape
   */
  sanitizeCategory(category: ICategory): CategoryResponse {
    return {
      id: category._id.toString(),
      name: category.name,
      image: category.image,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  /**
   * Format Product document into clean response shape
   */
  sanitizeProduct(product: any): ProductResponse {
    let categoryData: CategoryResponse | string = '';

    if (product.category && typeof product.category === 'object' && product.category._id) {
      categoryData = this.sanitizeCategory(product.category);
    } else if (product.category) {
      categoryData = product.category.toString();
    }

    return {
      id: product._id.toString(),
      name: product.name,
      category: categoryData,
      image: product.image,
      shortDescription: product.shortDescription,
      price: product.price,
      isFeatured: product.isFeatured,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Fetch active banners
   */
  async getActiveBanners(): Promise<BannerResponse[]> {
    const banners = await Banner.find({ status: 'active' }).sort({ createdAt: -1 });
    return banners.map((b) => this.sanitizeBanner(b));
  }

  /**
   * Fetch active categories
   */
  async getActiveCategories(): Promise<CategoryResponse[]> {
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    return categories.map((c) => this.sanitizeCategory(c));
  }

  /**
   * Fetch active products with filtering, search & pagination
   */
  async getActiveProducts(query: ProductQuery): Promise<PaginatedProductsResponse> {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const filter: any = { status: 'active' };

    // Search filter (name or shortDescription)
    if (query.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { shortDescription: searchRegex }];
    }

    // Category filter
    if (query.category && query.category.trim() !== '') {
      const catInput = query.category.trim();
      // If valid ObjectId use directly, else lookup category by name
      if (catInput.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = catInput;
      } else {
        const foundCat = await Category.findOne({ name: new RegExp(`^${catInput}$`, 'i') });
        if (foundCat) {
          filter.category = foundCat._id;
        } else {
          // Non-existent category filter produces empty result
          filter.category = null;
        }
      }
    }

    // Featured filter
    if (query.featured === 'true' || query.featured === '1') {
      filter.isFeatured = true;
    }

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const products = await Product.find(filter)
      .populate('category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const sanitizedProducts = products.map((p) => this.sanitizeProduct(p));

    return {
      products: sanitizedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  }

  /**
   * Fetch aggregated data for Home screen dashboard
   */
  async getHomeScreenData(userId?: string): Promise<HomeScreenData> {
    // 1. Fetch user profile if logged in
    let user;
    if (userId) {
      const userDoc = await authService.findUserById(userId);
      if (userDoc) {
        user = authService.sanitizeUser(userDoc);
      }
    }

    // 2. Fetch active banners (limit top 5)
    const banners = await Banner.find({ status: 'active' }).sort({ createdAt: -1 }).limit(5);

    // 3. Fetch active categories
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });

    // 4. Fetch featured products (limit top 6)
    const featuredDocs = await Product.find({ status: 'active', isFeatured: true })
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(6);

    // 5. Fetch latest products (limit top 8)
    const latestDocs = await Product.find({ status: 'active' })
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(8);

    return {
      user,
      banners: banners.map((b) => this.sanitizeBanner(b)),
      categories: categories.map((c) => this.sanitizeCategory(c)),
      featuredProducts: featuredDocs.map((p) => this.sanitizeProduct(p)),
      latestProducts: latestDocs.map((p) => this.sanitizeProduct(p)),
    };
  }

  /**
   * Seed initial sample data for Petra Cements if database is empty
   */
  async seedInitialDataIfNeeded(): Promise<void> {
    try {
      const bannerCount = await Banner.countDocuments();
      if (bannerCount === 0) {
        console.log('[Seed] Populating initial Petra Cements banners, categories, and products...');

        // 1. Banners
        await Banner.insertMany([
          {
            title: 'Petra Cements - Building Strong Foundations',
            description: 'Premium quality Portland Pozzolana & Ordinary Portland Cement for durable structures.',
            image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
            status: 'active',
          },
          {
            title: 'Special Bulk Discount on OPC 53 Grade',
            description: 'Direct site delivery with certified laboratory test reports.',
            image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
            status: 'active',
          },
        ]);

        // 2. Categories
        const catPPC = await Category.create({
          name: 'Portland Pozzolana Cement (PPC)',
          image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
          status: 'active',
        });

        const catOPC = await Category.create({
          name: 'Ordinary Portland Cement (OPC 53)',
          image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
          status: 'active',
        });

        const catRMC = await Category.create({
          name: 'Ready Mix Concrete (RMC)',
          image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80',
          status: 'active',
        });

        // 3. Products: Skipped legacy dummy products. Real cement catalog is seeded via productService.seedCementCatalogIfNeeded()

        console.log('[Seed] Sample data created successfully.');
      }

      // 4. Seed Default User & Agent accounts if they do not exist
      const existingUser = await User.findOne({ email: 'user@petracement.com' });
      if (!existingUser) {
        console.log('[Seed] Creating default User test account...');
        await authService.createUser('Test Customer', 'user@petracement.com', '9876543210', 'Password123', 'user');
      }

      const existingAgent = await User.findOne({ email: 'agent@petracement.com' });
      if (!existingAgent) {
        console.log('[Seed] Creating default Agent test account...');
        await authService.createUser('Karthik Sales Agent', 'agent@petracement.com', '9876543212', 'Password123', 'agent');
      }

      console.log('[Seed] User and Agent accounts verified successfully.');
    } catch (err) {
      console.error('[Seed] Error populating initial data:', err);
    }
  }
}

export const homeService = new HomeService();
