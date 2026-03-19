import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-form-field',
  standalone: true,
  template: `
    <label class="admin-form-field">
      <span class="admin-form-field__label">{{ label() }}</span>
      <ng-content />
      @if (hint()) {
        <small class="admin-form-field__hint">{{ hint() }}</small>
      }
    </label>
  `,
  styleUrl: './admin-form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFormFieldComponent {
  readonly label = input.required<string>();
  readonly hint = input('');
}
