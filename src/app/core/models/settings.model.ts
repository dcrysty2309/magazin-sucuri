export type SettingsModuleKey = 'general' | 'shipping' | 'payments' | 'seo';

export interface StoreGeneralSettings {
  storeName: string;
  email: string;
  phone: string;
  currency: 'RON' | 'EUR' | 'USD';
  logoUrl: string;
}

export interface StoreShippingSettings {
  cost: number;
  freeThreshold: number;
  enabled: boolean;
  zones: ShippingZone[];
}

export interface ShippingZone {
  id: string;
  name: string;
  enabled: boolean;
  etaDays: number;
  priceModifier: number;
}

export interface StorePaymentsSettings {
  cashOnDelivery: boolean;
  onlineCard: boolean;
  bankTransfer: boolean;
}

export interface StoreSeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export interface StoreTaxSettings {
  vatRate: number;
  includedInPrice: boolean;
}

export interface StoreLocationSettings {
  warehouseName: string;
  addressLine: string;
  city: string;
  county: string;
  postalCode: string;
}

export interface StoreSettings {
  general: StoreGeneralSettings;
  shipping: StoreShippingSettings;
  payments: StorePaymentsSettings;
  seo: StoreSeoSettings;
  taxes: StoreTaxSettings;
  location: StoreLocationSettings;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  general: {
    storeName: 'Livada Noastra',
    email: 'contact@livadanoastra.local',
    phone: '0722000000',
    currency: 'RON',
    logoUrl: '/images/homepage-hero.png',
  },
  shipping: {
    cost: 19,
    freeThreshold: 150,
    enabled: true,
    zones: [
      { id: 'north', name: 'Nord', enabled: true, etaDays: 1, priceModifier: 0 },
      { id: 'south', name: 'Sud', enabled: true, etaDays: 1, priceModifier: 0 },
      { id: 'east', name: 'Est', enabled: true, etaDays: 2, priceModifier: 4 },
      { id: 'west', name: 'Vest', enabled: true, etaDays: 2, priceModifier: 2 },
    ],
  },
  payments: {
    cashOnDelivery: true,
    onlineCard: false,
    bankTransfer: true,
  },
  seo: {
    metaTitle: 'Livada Noastra | Suc de mere natural',
    metaDescription: 'Magazin online cu suc de mere natural, presat la rece, fara zahar adaugat.',
    keywords: 'suc de mere, suc natural, livada, mere romanesti',
  },
  taxes: {
    vatRate: 19,
    includedInPrice: true,
  },
  location: {
    warehouseName: 'Depozit principal Livada Noastra',
    addressLine: 'Strada Merilor 12',
    city: 'Pitesti',
    county: 'Arges',
    postalCode: '110000',
  },
};
