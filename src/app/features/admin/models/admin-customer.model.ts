import { AdminOrderListItem } from './admin-order.model';

export interface AdminCustomerListItem {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  ordersCount?: number;
  totalSpent?: number;
  createdAt?: string;
}

export interface AdminCustomerAddress {
  id: string;
  label: string;
  recipientName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  county: string;
  postalCode: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface AdminCustomerDetail extends AdminCustomerListItem {
  orders?: AdminOrderListItem[];
  addresses?: AdminCustomerAddress[];
}
