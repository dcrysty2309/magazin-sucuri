import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-empty-state',
  standalone: true,
  template: `
    <section class="admin-empty-state">
      <strong>{{ title() }}</strong>
      @if (description()) {
        <p>{{ description() }}</p>
      }
      <div class="admin-empty-state__actions">
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './admin-empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input('');
}
