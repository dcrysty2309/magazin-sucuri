import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-action-bar',
  standalone: true,
  template: `
    <section class="admin-action-bar">
      <div class="admin-action-bar__content">
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './admin-action-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminActionBarComponent {}
