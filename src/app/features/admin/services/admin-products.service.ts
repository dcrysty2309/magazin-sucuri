import { Injectable } from '@angular/core';

import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminCategory, AdminProduct, AdminProductPayload } from '../models/admin-product.model';

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  constructor(private readonly api: AdminApiService) {}

  async getProducts(): Promise<AdminProduct[]> {
    const payload = await this.api.get<{ products: AdminProduct[] }>('/api/admin/products');
    return payload.products ?? [];
  }

  async getProduct(id: string): Promise<AdminProduct> {
    const payload = await this.api.get<{ product: AdminProduct }>(`/api/admin/products/${id}`);
    return payload.product;
  }

  async createProduct(data: AdminProductPayload): Promise<AdminProduct> {
    const payload = await this.api.post<{ product: AdminProduct }>('/api/admin/products', data);
    return payload.product;
  }

  async updateProduct(id: string, data: Partial<AdminProductPayload>): Promise<AdminProduct> {
    const payload = await this.api.patch<{ product: AdminProduct }>(`/api/admin/products/${id}`, data);
    return payload.product;
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.api.delete<{ message: string }>(`/api/admin/products/${id}`);
  }

  async getCategories(): Promise<AdminCategory[]> {
    const payload = await this.api.get<{ categories: AdminCategory[] }>('/api/admin/categories');
    return payload.categories ?? [];
  }
}
