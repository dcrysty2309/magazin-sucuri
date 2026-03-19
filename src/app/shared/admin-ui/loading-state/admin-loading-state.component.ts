import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-loading-state',
  standalone: true,
  template: `
    <div class="admin-loading-state">
      <div class="admin-loading-state__bar"></div>
      <div class="admin-loading-state__bar admin-loading-state__bar--short"></div>
      @if (message()) {
        <p>{{ message() }}</p>
      }
    </div>
  `,
  styleUrl: './admin-loading-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoadingStateComponent {
  readonly message = input('Se incarca...');
}
