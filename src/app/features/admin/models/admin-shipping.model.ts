export interface AdminShippingZone {
  id: string;
  name: string;
  enabled: boolean;
  etaDays: number;
  priceModifier: number;
}

export interface AdminShippingSettings {
  shipping: {
    cost: number;
    freeThreshold: number;
    enabled: boolean;
    zones: AdminShippingZone[];
  };
  location: {
    warehouseName: string;
    city: string;
    county: string;
    postalCode: string;
  };
}
