export interface AdminPaymentSettings {
  payments: {
    cashOnDelivery: boolean;
    onlineCard: boolean;
    bankTransfer: boolean;
  };
}
