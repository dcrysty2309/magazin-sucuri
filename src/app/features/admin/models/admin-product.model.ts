export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

export interface AdminProduct {
  id: string;
  categoryId: string;
  categoryName?: string;
  slug?: string;
  sku: string;
  name: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  volumeLabel: string;
  badge?: string | null;
  accent?: string;
  image: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface AdminProductPayload {
  categoryId: string;
  name: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  volumeLabel: string;
  badge: string;
  accent: string;
  image: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
}
