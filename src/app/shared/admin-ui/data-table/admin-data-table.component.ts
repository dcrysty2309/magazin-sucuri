import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-data-table',
  standalone: true,
  template: `
    <div class="admin-data-table">
      <ng-content />
    </div>
  `,
  styleUrl: './admin-data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDataTableComponent {}
