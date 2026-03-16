import { Component } from '@angular/core';

import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell.component';

@Component({
  selector: 'app-processing-page',
  standalone: true,
  imports: [PageShellComponent],
  templateUrl: './processing-page.component.html',
  styleUrl: './processing-page.component.scss',
})
export class ProcessingPageComponent {}
