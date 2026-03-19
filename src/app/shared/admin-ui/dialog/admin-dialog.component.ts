import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-admin-dialog',
  standalone: true,
  template: `
    <div class="admin-dialog">
      <div class="admin-dialog__backdrop" (click)="closed.emit()"></div>
      <section class="admin-dialog__panel" [style.width]="width()">
        <ng-content />
      </section>
    </div>
  `,
  styleUrl: './admin-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDialogComponent {
  readonly width = input('min(520px, calc(100vw - 32px))');
  readonly closed = output<void>();
}
