import { CategoryResponse } from './home.types';

export interface ISpecs {
  packagingSize?: string;
  type?: string;
  packagingType?: string;
  brand?: string;
  usage?: string;
  color?: string;
  features?: string;
  compressiveStrength?: string;
  standard?: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  subtitle?: string;
  brand?: string;
  brandId?: string;
  category: CategoryResponse | string;
  images: string[];
  image: string;
  shortDescription?: string;
  description?: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  featured: boolean;
  isFeatured: boolean;
  specs?: ISpecs;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDto {
  name: string;
  subtitle?: string;
  brand?: string;
  brandId?: string;
  category?: string;
  images?: string[];
  image?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  stock?: number;
  status?: 'active' | 'inactive';
  featured?: boolean;
  isFeatured?: boolean;
  specs?: ISpecs;
}

export interface UpdateProductDto {
  name?: string;
  subtitle?: string;
  brand?: string;
  brandId?: string;
  category?: string;
  images?: string[];
  image?: string;
  shortDescription?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: 'active' | 'inactive';
  featured?: boolean;
  isFeatured?: boolean;
  specs?: ISpecs;
}

export interface ProductQueryOptions {
  page?: string;
  limit?: string;
  search?: string;
  brand?: string;
  category?: string;
  status?: string;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
  featured?: string;
}

export interface PaginatedProductResponse {
  products: ProductResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
