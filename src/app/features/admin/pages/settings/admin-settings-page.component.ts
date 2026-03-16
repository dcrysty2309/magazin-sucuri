import { Component } from '@angular/core';

import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell.component';

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [PageShellComponent],
  templateUrl: './admin-settings-page.component.html',
  styleUrl: './admin-settings-page.component.scss',
})
export class AdminSettingsPageComponent {}
