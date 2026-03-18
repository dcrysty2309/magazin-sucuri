import { Injectable } from '@angular/core';

import { apiUrl } from '../utils/api-url';

export type DashboardRange = '1' | '7' | '30' | 'total';
export type DashboardExportType = 'csv' | 'excel' | 'pdf';
export type DashboardOrderStatus = 'Noua' | 'In pregatire' | 'In livrare' | 'Livrata';
export type DashboardMetricUnit = 'currency' | 'number';
export type DashboardMetricTrend = 'up' | 'down' | 'neutral';

export interface DashboardKpiHistoryPoint {
  label: string;
  value: number;
}

export interface DashboardKpiMetric {
  id: 'revenue' | 'users' | 'orders' | 'pageViews';
  label: string;
  value: number;
  unit: DashboardMetricUnit;
  changePct: number;
  trend: DashboardMetricTrend;
  history: DashboardKpiHistoryPoint[];
  description: string;
  isMock?: boolean;
}

export interface DashboardStatsResponse {
  stats: Array<{ label: string; value: string; detail: string }>;
  kpis: DashboardKpiMetric[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  async getStats(): Promise<DashboardStatsResponse> {
    const payload = await this.get('/api/dashboard/stats');
    return {
      stats: payload.stats ?? [],
      kpis: payload.kpis ?? [],
    };
  }

  async getSales(range: DashboardRange): Promise<Array<{ label: string; value: number }>> {
    const payload = await this.get(`/api/dashboard/sales?range=${encodeURIComponent(range)}`);
    return payload.points ?? [];
  }

  async getRecentOrders(): Promise<any[]> {
    const payload = await this.get('/api/dashboard/recent-orders');
    return payload.orders ?? [];
  }

  async getTopProducts(range: DashboardRange): Promise<Array<{ label: string; value: number }>> {
    const payload = await this.get(`/api/dashboard/top-products?range=${encodeURIComponent(range)}`);
    return payload.products ?? [];
  }

  async updateOrderStatus(id: string, status: DashboardOrderStatus): Promise<any> {
    const payload = await this.patch(`/api/admin/orders/${id}`, { status });
    return payload.order;
  }

  async exportReport(type: DashboardExportType, range: DashboardRange): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(apiUrl(`/api/dashboard/export?type=${encodeURIComponent(type)}&range=${encodeURIComponent(range)}`), {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Exportul a esuat.');
    }

    const contentDisposition = response.headers.get('Content-Disposition') || '';
    const filenameMatch = contentDisposition.match(/filename=\"?([^"]+)\"?/i);

    return {
      blob: await response.blob(),
      filename: filenameMatch?.[1] || `dashboard-report.${type === 'excel' ? 'xls' : type}`,
    };
  }

  private async get(path: string): Promise<any> {
    const response = await fetch(apiUrl(path), { credentials: 'include' });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: 'Cererea dashboard a esuat.' }));
      throw new Error(payload.message || 'Cererea dashboard a esuat.');
    }

    return response.json();
  }

  private async patch(path: string, body: any): Promise<any> {
    const response = await fetch(apiUrl(path), {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: 'Actualizarea comenzii a esuat.' }));
      throw new Error(payload.message || 'Actualizarea comenzii a esuat.');
    }

    return response.json();
  }
}
