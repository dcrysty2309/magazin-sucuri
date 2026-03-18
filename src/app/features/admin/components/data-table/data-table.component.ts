import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';

export interface DataTableColumn {
  key: string;
  label: string;
  align?: 'start' | 'end';
  kind?: 'text' | 'currency' | 'date' | 'badge';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
  @Input({ required: true }) columns: DataTableColumn[] = [];
  @Input() rows: any[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'Nu exista date.';
  @Input() actionTemplate?: TemplateRef<any>;
  @Input() columnTemplate?: string;

  get gridTemplateColumns(): string {
    return this.columnTemplate ?? `repeat(${this.columns.length + (this.actionTemplate ? 1 : 0)}, minmax(0, 1fr))`;
  }

  formatCell(column: DataTableColumn, row: any): string {
    const value = row?.[column.key];
    if (value == null) {
      return '-';
    }

    if (column.kind === 'currency') {
      return `${new Intl.NumberFormat('ro-RO').format(Number(value || 0))} Lei`;
    }

    if (column.kind === 'date') {
      return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
    }

    return String(value);
  }
}
