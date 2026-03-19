import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-badge',
  standalone: true,
  template: `
    <span
      class="admin-ui-badge"
      [class.admin-ui-badge--info]="tone() === 'info'"
      [class.admin-ui-badge--primary]="tone() === 'primary'"
      [class.admin-ui-badge--indigo]="tone() === 'indigo'"
      [class.admin-ui-badge--success]="tone() === 'success'"
      [class.admin-ui-badge--warning]="tone() === 'warning'"
      [class.admin-ui-badge--danger]="tone() === 'danger'"
      [class.admin-ui-badge--neutral]="tone() === 'neutral'"
    >
      <ng-content />
    </span>
  `,
  styleUrl: './admin-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBadgeComponent {
  readonly tone = input<'info' | 'primary' | 'indigo' | 'neutral' | 'success' | 'warning' | 'danger'>('neutral');
}
