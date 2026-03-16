import { Component } from '@angular/core';

import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [PageShellComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
})
export class AboutPageComponent {}
