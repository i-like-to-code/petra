import { UserResponse } from './auth.types';

export interface BannerResponse {
  id: string;
  title: string;
  description?: string;
  image: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryResponse {
  id: string;
  name: string;
  image: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductResponse {
  id: string;
  name: string;
  category: CategoryResponse | string;
  image: string;
  shortDescription?: string;
  price: number;
  isFeatured: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  featured?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface PaginatedProductsResponse {
  products: ProductResponse[];
  pagination: PaginationMeta;
}

export interface HomeScreenData {
  user?: UserResponse;
  banners: BannerResponse[];
  categories: CategoryResponse[];
  featuredProducts: ProductResponse[];
  latestProducts: ProductResponse[];
}
