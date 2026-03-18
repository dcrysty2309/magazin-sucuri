import { Injectable } from '@angular/core';

import { apiUrl } from '../utils/api-url';

@Injectable({ providedIn: 'root' })
export class AdminService {
  async login(credentials: { email: string; password: string; remember: boolean }): Promise<{ ok: boolean; message?: string }> {
    const response = await fetch(apiUrl('/api/admin/login'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const payload = await response.json();
    return response.ok
      ? { ok: true, message: payload.message }
      : { ok: false, message: payload.message || 'Autentificarea admin a esuat.' };
  }

  async getDashboard(range: '7' | '30' | 'total' = '7'): Promise<any> {
    return this.get(`/api/admin/dashboard?range=${encodeURIComponent(range)}`);
  }

  async getProducts(): Promise<any[]> {
    const payload = await this.get('/api/admin/products');
    return payload.products ?? [];
  }

  async getProduct(id: string): Promise<any> {
    const payload = await this.get(`/api/admin/products/${id}`);
    return payload.product;
  }

  async createProduct(data: any): Promise<any> {
    const payload = await this.post('/api/admin/products', data);
    return payload.product;
  }

  async updateProduct(id: string, data: any): Promise<any> {
    const payload = await this.patch(`/api/admin/products/${id}`, data);
    return payload.product;
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.delete(`/api/admin/products/${id}`);
  }

  async getCategories(): Promise<any[]> {
    const payload = await this.get('/api/admin/categories');
    return payload.categories ?? [];
  }

  async createCategory(data: any): Promise<any> {
    const payload = await this.post('/api/admin/categories', data);
    return payload.category;
  }

  async getOrders(): Promise<any[]> {
    const payload = await this.get('/api/admin/orders');
    return payload.orders ?? [];
  }

  async createOrder(data: any): Promise<any> {
    const payload = await this.post('/api/admin/orders', data);
    return payload.order;
  }

  async getOrder(id: string): Promise<any> {
    const payload = await this.get(`/api/admin/orders/${id}`);
    return payload.order;
  }

  async updateOrder(id: string, data: any): Promise<any> {
    const payload = await this.patch(`/api/admin/orders/${id}`, data);
    return payload.order;
  }

  async deleteOrder(id: string): Promise<{ message: string }> {
    return this.delete(`/api/admin/orders/${id}`);
  }

  async getCustomers(): Promise<any[]> {
    const payload = await this.get('/api/admin/customers');
    return payload.customers ?? [];
  }

  async createCustomer(data: any): Promise<any> {
    const payload = await this.post('/api/admin/customers', data);
    return payload.customer;
  }

  async getCustomer(id: string): Promise<any> {
    const payload = await this.get(`/api/admin/customers/${id}`);
    return payload.customer;
  }

  async updateCustomer(id: string, data: any): Promise<any> {
    const payload = await this.patch(`/api/admin/customers/${id}`, data);
    return payload.customer;
  }

  async deleteCustomer(id: string): Promise<{ message: string }> {
    return this.delete(`/api/admin/customers/${id}`);
  }

  async getInventory(): Promise<any[]> {
    const payload = await this.get('/api/admin/inventory');
    return payload.items ?? [];
  }

  async getShippingSettings(): Promise<any> {
    return this.get('/api/admin/shipping');
  }

  async updateShippingSettings(data: any): Promise<any> {
    return this.post('/api/admin/shipping', data);
  }

  async getPaymentsSettings(): Promise<any> {
    return this.get('/api/admin/payments');
  }

  async updatePaymentsSettings(data: any): Promise<any> {
    return this.post('/api/admin/payments', data);
  }

  async getAnalytics(): Promise<any> {
    return this.get('/api/admin/analytics');
  }

  private async get(path: string): Promise<any> {
    const response = await fetch(apiUrl(path), { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Cererea admin a esuat.');
    }
    return response.json();
  }

  private async post(path: string, body: any): Promise<any> {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.message || 'Cererea admin a esuat.');
    }

    return response.json();
  }

  private async patch(path: string, body: any): Promise<any> {
    const response = await fetch(apiUrl(path), {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.message || 'Cererea admin a esuat.');
    }

    return response.json();
  }

  private async delete(path: string): Promise<any> {
    const response = await fetch(apiUrl(path), {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.message || 'Cererea admin a esuat.');
    }

    return response.json();
  }
}
