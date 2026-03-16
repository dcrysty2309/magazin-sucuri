import { Component } from '@angular/core';

import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell.component';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [PageShellComponent],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent {}
