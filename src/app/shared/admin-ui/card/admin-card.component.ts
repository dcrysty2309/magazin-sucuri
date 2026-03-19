import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-card',
  standalone: true,
  template: `
    <section class="admin-ui-card" [class.admin-ui-card--compact]="compact()">
      <ng-content />
    </section>
  `,
  styleUrl: './admin-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCardComponent {
  readonly compact = input(false);
}
