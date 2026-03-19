import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-page-header',
  standalone: true,
  template: `
    <header class="admin-page-header">
      <div class="admin-page-header__copy">
        @if (eyebrow()) {
          <p class="admin-page-header__eyebrow">{{ eyebrow() }}</p>
        }

        <h1 class="admin-page-header__title">{{ title() }}</h1>

        @if (description()) {
          <p class="admin-page-header__description">{{ description() }}</p>
        }
      </div>

      <div class="admin-page-header__actions">
        <ng-content select="[page-actions]" />
      </div>
    </header>
  `,
  styleUrl: './admin-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageHeaderComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
}
