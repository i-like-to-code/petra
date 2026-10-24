import mongoose from 'mongoose';
import { Product, IProduct } from '../models/product.model';
import { Category, ICategory } from '../models/category.model';
import {
  ProductResponse,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryOptions,
  PaginatedProductResponse,
} from '../types/product.types';
import { CategoryResponse } from '../types/home.types';

export class ProductService {
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

  sanitizeProduct(product: any): ProductResponse {
    let categoryData: CategoryResponse | string = '';

    if (product.category && typeof product.category === 'object' && product.category._id) {
      categoryData = this.sanitizeCategory(product.category);
    } else if (product.category) {
      categoryData = product.category.toString();
    }

    const imagesArray: string[] = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (product.image ? [product.image] : []);

    const primaryImage: string = imagesArray.length > 0 ? imagesArray[0] : (product.image || '');

    return {
      id: product._id.toString(),
      name: product.name,
      subtitle: product.subtitle || '',
      brand: product.brand || product.specs?.brand || 'UltraTech Cement',
      brandId: product.brandId || 'ultratech',
      category: categoryData,
      images: imagesArray,
      image: primaryImage,
      shortDescription: product.shortDescription || '',
      description: product.description || product.shortDescription || '',
      price: product.price,
      stock: product.stock !== undefined ? product.stock : 0,
      status: product.status || 'active',
      featured: !!(product.isFeatured || product.featured),
      isFeatured: !!(product.isFeatured || product.featured),
      specs: product.specs || {},
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async getProducts(query: ProductQueryOptions, isAdmin: boolean = false): Promise<PaginatedProductResponse> {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (!isAdmin) {
      filter.status = 'active';
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.brand && query.brand.toLowerCase() !== 'all') {
      filter.$or = [
        { brandId: new RegExp('^' + query.brand + '$', 'i') },
        { brand: new RegExp(query.brand, 'i') }
      ];
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { shortDescription: searchRegex },
        { 'specs.type': searchRegex }
      ];
    }

    const sortOptions: any = {};
    if (query.sort === 'newest') sortOptions.createdAt = -1;
    else if (query.sort === 'oldest') sortOptions.createdAt = 1;
    else if (query.sort === 'price_asc') sortOptions.price = 1;
    else if (query.sort === 'price_desc') sortOptions.price = -1;
    else sortOptions.createdAt = -1;

    const [products, total] = await Promise.all([
      Product.find(filter).populate('category').sort(sortOptions).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      products: products.map((p) => this.sanitizeProduct(p)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getProductById(id: string, isAdmin: boolean = false): Promise<ProductResponse | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const filter: any = { _id: id };
    if (!isAdmin) filter.status = 'active';
    const product = await Product.findOne(filter).populate('category');
    return product ? this.sanitizeProduct(product) : null;
  }

  async getActiveCategories(): Promise<CategoryResponse[]> {
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    return categories.map((c) => this.sanitizeCategory(c));
  }

  async getAllCategoriesAdmin(): Promise<CategoryResponse[]> {
    const categories = await Category.find().sort({ createdAt: -1 });
    return categories.map((c) => this.sanitizeCategory(c));
  }

  async createProduct(dto: CreateProductDto): Promise<ProductResponse> {
    const images = Array.isArray(dto.images) && dto.images.length > 0
      ? dto.images
      : (dto.image ? [dto.image] : ['/cements/ultratech-super-ppc.png']);

    const newProduct = new Product({
      name: dto.name,
      subtitle: dto.subtitle || '',
      brand: dto.brand || dto.specs?.brand || 'UltraTech Cement',
      brandId: dto.brandId || 'ultratech',
      category: dto.category || undefined,
      images,
      shortDescription: dto.shortDescription || '',
      description: dto.description || '',
      price: dto.price,
      stock: dto.stock ?? 0,
      isFeatured: !!(dto.isFeatured || dto.featured),
      status: dto.status || 'active',
      specs: dto.specs || {},
    });

    const saved = await newProduct.save();
    return this.sanitizeProduct(saved);
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<ProductResponse | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const updateData: any = { ...dto };
    if (dto.featured !== undefined) updateData.isFeatured = dto.featured;
    if (dto.images && dto.images.length > 0) updateData.images = dto.images;

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true }).populate('category');
    return updated ? this.sanitizeProduct(updated) : null;
  }

  async deleteProduct(id: string, hardDelete: boolean = false): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const deleted = hardDelete ? await Product.findByIdAndDelete(id) : await Product.findByIdAndUpdate(id, { status: "inactive" });
    return !!deleted;
  }

  async createCategory(name: string, image: string, status?: "active" | "inactive"): Promise<CategoryResponse> {
    const cat = new Category({ name, image: image || 'https://via.placeholder.com/150', status: status || 'active' });
    const saved = await cat.save();
    return this.sanitizeCategory(saved);
  }

  async updateCategory(id: string, name?: string, image?: string, status?: 'active' | 'inactive'): Promise<CategoryResponse | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (image) updateData.image = image;
    if (status) updateData.status = status;
    const updated = await Category.findByIdAndUpdate(id, updateData, { new: true });
    return updated ? this.sanitizeCategory(updated) : null;
  }

  // Automatic Seed for the 6 Major Brands and their real products
  async seedCementCatalogIfNeeded(): Promise<void> {
    try {
      const count = await Product.countDocuments();
      if (count > 0) {
        console.log(`[ProductService] Products catalog already has ${count} items. Skipping seed.`);
        return;
      }

      console.log('[ProductService] Seeding initial 6 cement brands and 17 formulations...');

      // 1. Create default categories
      const opcCat = await Category.findOneAndUpdate(
        { name: 'OPC 53 Grade' },
        { name: 'OPC 53 Grade', image: '/cements/ultratech-opc.jpg', status: 'active' },
        { upsert: true, new: true }
      );
      const ppcCat = await Category.findOneAndUpdate(
        { name: 'PPC Pozzolana' },
        { name: 'PPC Pozzolana', image: '/cements/ultratech-super-ppc.png', status: 'active' },
        { upsert: true, new: true }
      );
      const pscCat = await Category.findOneAndUpdate(
        { name: 'PSC Slag Cement' },
        { name: 'PSC Slag Cement', image: '/cements/ramco-super-coast.jpg', status: 'active' },
        { upsert: true, new: true }
      );

      const sampleProducts = [
        {
          name: 'UltraTech Super PPC',
          subtitle: "The Engineer's Choice - Fly Ash Based",
          brand: 'UltraTech Cement',
          brandId: 'ultratech',
          category: ppcCat._id,
          price: 400,
          stock: 850,
          images: ['/cements/ultratech-super-ppc.png'],
          status: 'active',
          specs: {
            packagingSize: '50 kg',
            type: 'PPC (Pozzolana Portland Cement)',
            packagingType: 'HDPE Laminated Sack Bag',
            brand: 'UltraTech Cement',
            usage: 'Structural Concrete, Slabs & Beams',
            color: 'Light Grey',
            features: 'Engineered particle distribution, corrosion resistant',
            compressiveStrength: '33+ MPa at 28 days',
            standard: 'IS 1489 (Part 1)'
          }
        },
        {
          name: 'UltraTech OPC 53 Grade',
          subtitle: 'Structural High Strength Ordinary Portland',
          brand: 'UltraTech Cement',
          brandId: 'ultratech',
          category: opcCat._id,
          price: 425,
          stock: 1400,
          images: ['/cements/ultratech-opc.jpg'],
          status: 'active',
          specs: {
            packagingSize: '50 kg',
            type: 'OPC 53 Grade',
            packagingType: 'HDPE Laminated Sack Bag',
            brand: 'UltraTech Cement',
            usage: 'High-rise columns, bridges & pre-stressed concrete',
            color: 'Grey',
            features: 'Rapid early strength gain and high structural load',
            compressiveStrength: '53+ MPa at 28 days',
            standard: 'IS 12269'
          }
        },
        {
          name: 'Ramco Supergrade PPC',
          subtitle: 'Fly-Ash Engineered Pozzolana',
          brand: 'Ramco Cement',
          brandId: 'ramco',
          category: ppcCat._id,
          price: 390,
          stock: 920,
          images: ['/cements/ramco-supergrade.png'],
          status: 'active',
          specs: {
            packagingSize: '50 kg',
            type: 'PPC (Pozzolana Portland Cement)',
            packagingType: 'HDPE Sack Bag',
            brand: 'Ramco Cement',
            usage: 'Residential slabs, masonry & general plastering',
            color: 'Light Grey',
            features: 'High fineness, zero micro-cracks & low heat of hydration',
            compressiveStrength: '33+ MPa at 28 days',
            standard: 'IS 1489 (Part 1)'
          }
        },
        {
          name: 'Dalmia DSP Cement',
          subtitle: 'Dhalai Special PPC - Void Free Concrete',
          brand: 'Dalmia Cement',
          brandId: 'dalmia',
          category: ppcCat._id,
          price: 395,
          stock: 1100,
          images: ['/cements/dalmia-dsp.png'],
          status: 'active',
          specs: {
            packagingSize: '50 kg',
            type: 'PPC (Pozzolana Portland Cement)',
            packagingType: 'HDPE Sack Bag',
            brand: 'Dalmia Cement',
            usage: 'Roof slab casting (Dhalai), foundations & structural frames',
            color: 'Light Grey',
            features: 'Micro-fine particles eliminate voids for waterproof slab',
            compressiveStrength: '38+ MPa at 28 days',
            standard: 'IS 1489 (Part 1)'
          }
        },
        {
          name: 'JSW Concreel HD PPC',
          subtitle: 'Heavy Duty Structural Durability Cement',
          brand: 'JSW Cement',
          brandId: 'jsw',
          category: ppcCat._id,
          price: 390,
          stock: 890,
          images: ['/cements/jsw-concreel-hd.png'],
          status: 'active',
          specs: {
            packagingSize: '50 kg',
            type: 'PPC (Pozzolana Portland Cement)',
            packagingType: 'HDPE Sack Bag',
            brand: 'JSW Cement',
            usage: 'RCC columns, slabs & heavy duty flooring',
            color: 'Grey',
            features: 'Superior bond strength, high impermeability & crack shield',
            compressiveStrength: '36+ MPa at 28 days',
            standard: 'IS 1489'
          }
        },
        {
          name: 'Zuari Super PPC Cement',
          subtitle: 'Italcementi Group European Quality Standards',
          brand: 'Zuari Cement',
          brandId: 'zuari',
          category: ppcCat._id,
          price: 385,
          stock: 610,
          images: ['/cements/zuari-ppc.png'],
          status: 'active',
          specs: {
            packagingSize: '50 kg',
            type: 'PPC (Pozzolana Portland Cement)',
            packagingType: 'HDPE Sack Bag',
            brand: 'Zuari Cement',
            usage: 'Smooth plastering, brick mortar & residential slabs',
            color: 'Grey',
            features: 'High Blaine fineness for silky smooth plaster finish',
            compressiveStrength: '34+ MPa at 28 days',
            standard: 'IS 1489'
          }
        }
      ];

      await Product.insertMany(sampleProducts);
      console.log(`[ProductService] Successfully seeded ${sampleProducts.length} initial products into database.`);
    } catch (err) {
      console.error('[ProductService] Error seeding catalog:', err);
    }
  }

  async getAdminCategories(): Promise<CategoryResponse[]> {
    return this.getAllCategoriesAdmin();
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const deleted = await Category.findByIdAndDelete(id);
    return !!deleted;
  }
  async toggleProduct(id: string, active?: boolean): Promise<ProductResponse | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const prod = await Product.findById(id);
    if (!prod) return null;
    const newStatus = active !== undefined ? (active ? 'active' : 'inactive') : (prod.status === 'active' ? 'inactive' : 'active');
    prod.status = newStatus;
    await prod.save();
    return this.sanitizeProduct(prod);
  }

  async toggleCementType(type: string, active: boolean): Promise<any> {
    const status = active ? 'active' : 'inactive';
    const regex = new RegExp(type, 'i');
    const updateResult = await Product.updateMany(
      {
        $or: [
          { 'specs.type': regex },
          { name: regex }
        ]
      },
      { $set: { status } }
    );

    await Category.updateMany(
      { name: regex },
      { $set: { status } }
    );

    return {
      type,
      active,
      status,
      modifiedCount: updateResult.modifiedCount,
    };
  }

  async getCementTypes(): Promise<any[]> {
    const typeDefinitions = [
      { id: 'ppc', name: 'PPC', label: 'Portland Pozzolana Cement', description: 'Fly-ash blended durable cement' },
      { id: 'opc', name: 'OPC 53', label: 'Ordinary Portland Cement (53 Grade)', description: 'High early strength RCC cement' },
      { id: 'psc', name: 'PSC', label: 'Portland Slag Cement', description: 'Corrosion and chemical resistant slag cement' },
      { id: 'white', name: 'White', label: 'White & Architectural Cement', description: 'Specialty aesthetic cement' },
      { id: 'composite', name: 'Composite', label: 'Composite & Slag Blends', description: 'Eco-friendly composite formulations' },
    ];

    const results = await Promise.all(typeDefinitions.map(async (t) => {
      const regex = new RegExp(t.name, 'i');
      const [totalCount, activeCount] = await Promise.all([
        Product.countDocuments({
          $or: [{ 'specs.type': regex }, { name: regex }]
        }),
        Product.countDocuments({
          $or: [{ 'specs.type': regex }, { name: regex }],
          status: 'active'
        })
      ]);

      return {
        ...t,
        productCount: totalCount,
        activeCount,
        active: activeCount > 0,
      };
    }));

    return results;
  }
}

export const productService = new ProductService();
