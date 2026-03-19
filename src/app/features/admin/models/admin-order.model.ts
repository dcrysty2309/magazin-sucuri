export type AdminOrderStatus = 'Noua' | 'In pregatire' | 'In curs de expediere' | 'Livrata' | 'Anulata';

export interface AdminOrderListItem {
  id: string;
  code: string;
  status: AdminOrderStatus | string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  createdAt?: string;
}

export interface AdminOrderAddress {
  line1: string;
  city: string;
  county: string;
  postalCode: string;
}

export interface AdminOrderItem {
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  address?: AdminOrderAddress | null;
  items: AdminOrderItem[];
}
