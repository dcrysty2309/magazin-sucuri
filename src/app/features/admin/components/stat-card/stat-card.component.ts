import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, signal } from '@angular/core';

import { DashboardStatCard } from '../../../../core/services/stats.service';

let nextSparklineId = 0;
const FALLBACK_METRIC: DashboardStatCard = {
  id: 'pageViews',
  label: 'Metrica',
  value: 0,
  unit: 'number',
  changePct: 0,
  trend: 'neutral',
  history: [],
  description: 'Metrica nu este disponibila.',
  icon: 'views',
  accent: 'sky',
};

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent implements OnChanges, OnDestroy {
  @Input() metric?: DashboardStatCard;
  @Input() loading = false;

  readonly animatedValue = signal(0);
  readonly sparklineId = `stat-card-sparkline-${++nextSparklineId}`;
  readonly titleId = `stat-card-title-${nextSparklineId}`;
  readonly descriptionId = `stat-card-description-${nextSparklineId}`;

  private frameId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.loading || !this.metric || (!changes['metric'] && !changes['loading'])) {
      return;
    }

    this.animateValue(this.metric.value);
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
  }

  get changeLabel(): string {
    const change = Number(this.displayMetric.changePct || 0);
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}% vs luna trecuta`;
  }

  get formattedValue(): string {
    const value = this.animatedValue();
    const rounded = Math.round(value);
    const formatted = new Intl.NumberFormat('ro-RO').format(rounded);
    return this.displayMetric.unit === 'currency' ? `${formatted} Lei` : formatted;
  }

  get sparklinePath(): string {
    return this.buildPolyline(false);
  }

  get sparklineAreaPath(): string {
    return this.buildPolyline(true);
  }

  get chartLabel(): string {
    if (!this.metric?.history.length) {
      return `${this.displayMetric.label}: grafic indisponibil`;
    }

    return `Evolutie pentru ${this.displayMetric.label}: ${this.changeLabel}. ${this.displayMetric.description}`;
  }

  get displayMetric(): DashboardStatCard {
    return this.metric ?? FALLBACK_METRIC;
  }

  private animateValue(target: number): void {
    this.cancelAnimation();

    const start = this.animatedValue();
    const duration = 720;
    const startedAt = performance.now();

    const step = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.animatedValue.set(start + (target - start) * eased);

      if (progress < 1) {
        this.frameId = window.requestAnimationFrame(step);
      } else {
        this.frameId = null;
        this.animatedValue.set(target);
      }
    };

    this.frameId = window.requestAnimationFrame(step);
  }

  private cancelAnimation(): void {
    if (this.frameId !== null) {
      window.cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private buildPolyline(closeArea: boolean): string {
    const points = this.displayMetric.history;
    if (!points.length) {
      return '';
    }

    const width = 284;
    const height = 74;
    const values = points.map((point) => Number(point.value || 0));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const stepX = points.length === 1 ? width : width / (points.length - 1);

    const segments = points.map((point, index) => {
      const x = Number((index * stepX).toFixed(2));
      const y = Number((height - ((Number(point.value || 0) - min) / span) * height).toFixed(2));
      return { x, y };
    });

    if (!segments.length) {
      return '';
    }

    let path = `M ${segments[0].x} ${segments[0].y}`;
    for (let index = 1; index < segments.length; index += 1) {
      const previous = segments[index - 1];
      const current = segments[index];
      const controlX = Number(((previous.x + current.x) / 2).toFixed(2));
      path += ` C ${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`;
    }

    if (!closeArea) {
      return path;
    }

    const last = segments[segments.length - 1];
    return `${path} L ${last.x} ${height} L ${segments[0].x} ${height} Z`;
  }
}
