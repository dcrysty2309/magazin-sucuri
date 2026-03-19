import { Directive } from '@angular/core';

@Directive({
  selector: 'textarea[appAdminTextarea]',
  standalone: true,
  host: {
    class: 'admin-ui-textarea',
  },
})
export class AdminTextareaDirective {}
