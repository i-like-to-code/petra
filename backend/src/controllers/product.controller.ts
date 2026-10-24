import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { ProductQueryOptions, CreateProductDto, UpdateProductDto } from '../types/product.types';

export class ProductController {
  /**
   * GET /api/products
   * Fetch active products for users with pagination, filters & sorting
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: ProductQueryOptions = req.query as any;
      const result = await productService.getProducts(query, false);

      res.status(200).json({
        success: true,
        message: 'Active products fetched successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/search
   * Search active products by name/description with category filter & pagination
   */
  async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: ProductQueryOptions = {
        ...req.query,
        search: (req.query.q as string) || (req.query.search as string) || '',
      };

      const result = await productService.getProducts(queryParams, false);

      res.status(200).json({
        success: true,
        message: 'Product search completed successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/categories
   * Fetch all active product categories
   */
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await productService.getActiveCategories();

      res.status(200).json({
        success: true,
        message: 'Active product categories fetched successfully.',
        data: {
          categories,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id
   * Fetch details for a specific product
   */
  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id, false);

      if (!product) {
        res.status(404).json({
          success: false,
          message: `Product with ID '${id}' not found or is currently inactive.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product details fetched successfully.',
        data: {
          product,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN CONTROLLER HANDLERS (PRODUCTS & CATEGORIES)
  // ==========================================

  /**
   * GET /api/admin/products
   * Fetch all products (including inactive) for admin management
   */
  async getAdminProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: ProductQueryOptions = req.query as any;
      const result = await productService.getProducts(query, true);

      res.status(200).json({
        success: true,
        message: 'All products fetched successfully for admin.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/products
   * Admin: Create a new product with input validation
   */
  async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, category, price, stock, images, image, shortDescription, description, status, featured, isFeatured }: CreateProductDto = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: 'Product name is required.' });
        return;
      }
      if (!category || (typeof category === 'string' && !category.trim())) {
        res.status(400).json({ success: false, message: 'Product category is required.' });
        return;
      }
      if (price === undefined || price === null || isNaN(Number(price))) {
        res.status(400).json({ success: false, message: 'Valid product price is required.' });
        return;
      }
      if (Number(price) < 0) {
        res.status(400).json({ success: false, message: 'Product price cannot be negative.' });
        return;
      }
      if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0)) {
        res.status(400).json({ success: false, message: 'Product stock cannot be negative.' });
        return;
      }

      const imgList = Array.isArray(images) && images.length > 0 ? images : (image ? [image] : []);
      if (imgList.length === 0) {
        res.status(400).json({ success: false, message: 'At least one product image URL is required.' });
        return;
      }

      const newProduct = await productService.createProduct({
        name,
        category,
        price: Number(price),
        stock: stock !== undefined ? Number(stock) : 0,
        images: imgList,
        shortDescription,
        description,
        status: status || 'active',
        featured: featured !== undefined ? featured : isFeatured,
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully.',
        data: {
          product: newProduct,
        },
      });
    } catch (error: any) {
      if (error.message && error.message.includes('not found')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/admin/products/:id
   * Admin: Update product details
   */
  async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateProductDto = req.body;

      if (dto.price !== undefined && (isNaN(Number(dto.price)) || Number(dto.price) < 0)) {
        res.status(400).json({ success: false, message: 'Product price cannot be negative.' });
        return;
      }
      if (dto.stock !== undefined && (isNaN(Number(dto.stock)) || Number(dto.stock) < 0)) {
        res.status(400).json({ success: false, message: 'Product stock cannot be negative.' });
        return;
      }

      const updatedProduct = await productService.updateProduct(id, dto);

      if (!updatedProduct) {
        res.status(404).json({
          success: false,
          message: `Product with ID '${id}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product updated successfully.',
        data: {
          product: updatedProduct,
        },
      });
    } catch (error: any) {
      if (error.message && error.message.includes('not found')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/admin/products/:id
   * Admin: Deactivate or remove a product
   */
  async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      // Default to hard delete (permanent removal) when admin deletes a product
      const hardDelete = req.query.hard !== 'false';

      const success = await productService.deleteProduct(id, hardDelete);

      if (!success) {
        res.status(404).json({
          success: false,
          message: `Product with ID '${id}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: hardDelete ? 'Product deleted permanently.' : 'Product deactivated successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/categories
   * Admin: List all product categories (including inactive)
   */
  async getAdminCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await productService.getAdminCategories();
      res.status(200).json({
        success: true,
        message: 'All product categories fetched for admin.',
        data: {
          categories,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/categories
   * Admin: Create a new category
   */
  async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, image, status } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: 'Category name is required.' });
        return;
      }
      if (!image || !image.trim()) {
        res.status(400).json({ success: false, message: 'Category image URL is required.' });
        return;
      }

      const newCategory = await productService.createCategory(name, image, status);

      res.status(201).json({
        success: true,
        message: 'Category created successfully.',
        data: {
          category: newCategory,
        },
      });
    } catch (error: any) {
      if (error.message && error.message.includes('already exists')) {
        res.status(409).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/admin/categories/:id
   * Admin: Update category details
   */
  async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, image, status } = req.body;

      const updated = await productService.updateCategory(id, name, image, status);

      if (!updated) {
        res.status(404).json({ success: false, message: `Category with ID '${id}' not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Category updated successfully.',
        data: {
          category: updated,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/categories/:id
   * Admin: Delete category
   */
  async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const success = await productService.deleteCategory(id);

      if (!success) {
        res.status(404).json({ success: false, message: `Category with ID '${id}' not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * PATCH /api/admin/products/:id/toggle
   * Admin: Toggle individual product active / inactive
   */
  async toggleProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const updated = await productService.toggleProduct(id, active);

      if (!updated) {
        res.status(404).json({ success: false, message: `Product with ID '${id}' not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Product '${updated.name}' set to ${updated.status}.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/products/types/toggle
   * Admin: Toggle entire cement type (PPC, OPC, PSC, White, etc.)
   */
  async toggleCementType(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, active } = req.body;
      const result = await productService.toggleCementType(type, active !== false);

      res.status(200).json({
        success: true,
        message: `Cement type '${type}' turned ${active ? 'ON' : 'OFF'}.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/types or /api/admin/products/types
   * Get cement types and their active/inactive status
   */
  async getCementTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await productService.getCementTypes();
      res.status(200).json({
        success: true,
        message: 'Cement types retrieved successfully.',
        data: types,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
