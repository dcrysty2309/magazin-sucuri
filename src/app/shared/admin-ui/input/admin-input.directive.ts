import { Directive } from '@angular/core';

@Directive({
  selector: 'input[appAdminInput]',
  standalone: true,
  host: {
    class: 'admin-ui-input',
  },
})
export class AdminInputDirective {}
