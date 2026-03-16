import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CartItemInput {
  id: string;
  name: string;
  variant: string;
  price: number | string;
  image: string;
}

export interface CartLineItem {
  id: string;
  name: string;
  variant: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

const CART_STORAGE_KEY = 'livada-noastra-cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly itemsState = signal<CartLineItem[]>(this.readInitialState());
  private readonly miniCartOpenState = signal(false);

  readonly items = computed(() => this.itemsState());
  readonly itemCount = computed(() =>
    this.itemsState().reduce((total, item) => total + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.itemsState().reduce((total, item) => total + item.unitPrice * item.quantity, 0),
  );
  readonly miniCartOpen = computed(() => this.miniCartOpenState());

  constructor() {
    effect(() => {
      if (!this.isBrowser) {
        return;
      }

      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.itemsState()));
    });
  }

  addItem(item: CartItemInput, quantity = 1): void {
    const normalizedQuantity = Math.max(1, quantity);
    const unitPrice = this.normalizePrice(item.price);

    this.itemsState.update((items) => {
      const existing = items.find((entry) => entry.id === item.id);

      if (existing) {
        return items.map((entry) =>
          entry.id === item.id
            ? { ...entry, quantity: entry.quantity + normalizedQuantity }
            : entry,
        );
      }

      return [
        ...items,
        {
          id: item.id,
          name: item.name,
          variant: item.variant,
          image: item.image,
          unitPrice,
          quantity: normalizedQuantity,
        },
      ];
    });

    this.openMiniCart();
  }

  increaseQuantity(id: string): void {
    this.itemsState.update((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)),
    );
  }

  decreaseQuantity(id: string): void {
    this.itemsState.update((items) =>
      items
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  removeItem(id: string): void {
    this.itemsState.update((items) => items.filter((item) => item.id !== id));
  }

  clear(): void {
    this.itemsState.set([]);
  }

  openMiniCart(): void {
    this.miniCartOpenState.set(true);
  }

  closeMiniCart(): void {
    this.miniCartOpenState.set(false);
  }

  formatPrice(value: number): string {
    return `${this.stripTrailingZeros(value)} Lei`;
  }

  private readInitialState(): CartLineItem[] {
    if (!this.isBrowser) {
      return [];
    }

    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) {
      return [];
    }

    try {
      const parsed = JSON.parse(saved) as CartLineItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private normalizePrice(value: number | string): number {
    if (typeof value === 'number') {
      return value;
    }

    const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private stripTrailingZeros(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/\.?0+$/, '');
  }
}
