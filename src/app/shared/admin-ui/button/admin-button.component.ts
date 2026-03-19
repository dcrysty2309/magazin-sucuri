import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-button',
  standalone: true,
  template: `
    <button
      class="admin-ui-button"
      [class.admin-ui-button--primary]="variant() === 'primary'"
      [class.admin-ui-button--secondary]="variant() === 'secondary'"
      [class.admin-ui-button--danger]="variant() === 'danger'"
      [class.admin-ui-button--ghost]="variant() === 'ghost'"
      [class.admin-ui-button--small]="size() === 'small'"
      [attr.type]="type()"
      [disabled]="disabled()"
    >
      <ng-content />
    </button>
  `,
  styleUrl: './admin-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'danger' | 'ghost'>('secondary');
  readonly size = input<'default' | 'small'>('default');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
}
