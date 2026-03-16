import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-email-preview-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './email-preview-page.component.html',
  styleUrl: './email-preview-page.component.scss',
})
export class EmailPreviewPageComponent {}
