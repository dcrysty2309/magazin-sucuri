export type CanonicalOrderStatus = 'Noua' | 'In pregatire' | 'In curs de expediere' | 'Livrata' | 'Anulata';
export type OrderStatusBadgeTone = 'info' | 'primary' | 'indigo' | 'success' | 'danger' | 'neutral';

const STATUS_ALIASES: Record<string, CanonicalOrderStatus> = {
  Confirmata: 'In pregatire',
  'In procesare': 'In pregatire',
  'In livrare': 'In curs de expediere',
  Trimisa: 'In curs de expediere',
};

export const CANONICAL_ORDER_STATUSES: CanonicalOrderStatus[] = [
  'Noua',
  'In pregatire',
  'In curs de expediere',
  'Livrata',
  'Anulata',
];

export function getDisplayOrderStatus(status: string): CanonicalOrderStatus | string {
  return STATUS_ALIASES[status] ?? status;
}

export function getOrderStatusTone(status: string): OrderStatusBadgeTone {
  switch (getDisplayOrderStatus(status)) {
    case 'Noua':
      return 'info';
    case 'In pregatire':
      return 'primary';
    case 'In curs de expediere':
      return 'indigo';
    case 'Livrata':
      return 'success';
    case 'Anulata':
      return 'danger';
    default:
      return 'neutral';
  }
}
