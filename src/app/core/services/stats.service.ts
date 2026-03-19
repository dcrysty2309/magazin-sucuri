import { Injectable } from '@angular/core';

import { DashboardKpiMetric } from './dashboard.service';

export interface DashboardStatCard extends DashboardKpiMetric {
  icon: 'revenue' | 'users' | 'orders' | 'views';
  accent: 'gold' | 'green' | 'earth' | 'sky';
}

const CARD_CONFIG: Record<DashboardKpiMetric['id'], Pick<DashboardStatCard, 'icon' | 'accent'>> = {
  revenue: { icon: 'revenue', accent: 'gold' },
  users: { icon: 'users', accent: 'green' },
  orders: { icon: 'orders', accent: 'earth' },
  pageViews: { icon: 'views', accent: 'sky' },
};

@Injectable({ providedIn: 'root' })
export class StatsService {
  toStatCards(metrics: DashboardKpiMetric[]): DashboardStatCard[] {
    return metrics.map((metric) => ({
      ...metric,
      ...CARD_CONFIG[metric.id],
    }));
  }
}
