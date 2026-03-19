import { Directive } from '@angular/core';

@Directive({
  selector: 'select[appAdminSelect]',
  standalone: true,
  host: {
    class: 'admin-ui-select',
  },
})
export class AdminSelectDirective {}
