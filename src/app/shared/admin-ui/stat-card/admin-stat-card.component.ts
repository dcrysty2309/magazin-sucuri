import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-stat-card',
  standalone: true,
  template: `
    <article class="admin-stat-card">
      <span class="admin-stat-card__label">{{ label() }}</span>
      <strong class="admin-stat-card__value">{{ value() }}</strong>
      @if (detail()) {
        <small class="admin-stat-card__detail">{{ detail() }}</small>
      }
    </article>
  `,
  styleUrl: './admin-stat-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly detail = input('');
}
