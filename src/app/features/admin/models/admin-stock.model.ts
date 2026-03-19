export interface AdminStockItem {
  id: string;
  productId?: string;
  name: string;
  productName: string;
  sku: string;
  categoryName?: string;
  stockQuantity: number;
  isActive: boolean;
}
