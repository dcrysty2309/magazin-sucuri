import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-action-button',
  standalone: true,
  templateUrl: './action-button.component.html',
  styleUrl: './action-button.component.scss',
})
export class ActionButtonComponent {
  @Input({ required: true }) label = '';
  @Input() icon: 'report' | 'export' = 'report';
  @Input() type: 'primary' | 'success' = 'primary';
  @Input() size: 'default' | 'compact' = 'default';
  @Input() appearance: 'default' | 'premium' = 'default';
  @Input() tooltip = '';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() expanded = false;
  @Input() clickHandler?: () => void;

  @Output() readonly buttonClick = new EventEmitter<void>();

  handleClick(): void {
    if (this.loading || this.disabled) {
      return;
    }

    this.clickHandler?.();
    this.buttonClick.emit();
  }
}
