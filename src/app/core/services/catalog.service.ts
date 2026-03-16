import { Injectable } from '@angular/core';

import { apiUrl } from '../utils/api-url';

export interface StoreCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string | null;
}

export interface StoreProductCard {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  shortDescription: string;
  volumeLabel: string;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  accent: string;
  stockQuantity: number;
  image: string;
  category: {
    slug: string;
    name: string;
  };
}

export interface StoreProductDetail {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  volumeLabel: string;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  accent: string;
  stockQuantity: number;
  category: {
    slug: string;
    name: string;
  };
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  highlights: string[];
}

export interface HomePagePayload {
  hero: {
    eyebrow: string;
    title: string[];
    subtitle: string[];
    image: string;
  };
  benefits: Array<{ label: string; icon: string }>;
  featuredProducts: StoreProductCard[];
  categories: StoreCategory[];
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  async getHomePage(): Promise<HomePagePayload> {
    const response = await fetch(apiUrl('/api/store/home'));
    if (!response.ok) {
      throw new Error('Nu am putut incarca homepage-ul.');
    }

    return response.json();
  }

  async getProducts(categorySlug?: string | null): Promise<StoreProductCard[]> {
    const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';
    const response = await fetch(apiUrl(`/api/store/products${query}`));

    if (!response.ok) {
      throw new Error('Nu am putut incarca produsele.');
    }

    const payload = await response.json();
    return payload.products ?? [];
  }

  async getCategories(): Promise<StoreCategory[]> {
    const response = await fetch(apiUrl('/api/store/categories'));

    if (!response.ok) {
      throw new Error('Nu am putut incarca categoriile.');
    }

    const payload = await response.json();
    return payload.categories ?? [];
  }

  async getProduct(slug: string): Promise<StoreProductDetail> {
    const response = await fetch(apiUrl(`/api/store/products/${encodeURIComponent(slug)}`));

    if (!response.ok) {
      throw new Error('Nu am putut incarca produsul.');
    }

    const payload = await response.json();
    return payload.product;
  }
}
