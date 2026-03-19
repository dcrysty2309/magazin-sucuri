import { Component, inject } from '@angular/core';

import { MetaService } from '../../../../core/services/meta.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent {
  private readonly metaService = inject(MetaService);

  constructor() {
    this.metaService.setPageTitle('Contact');
    this.metaService.setDescription(
      'Contacteaza echipa Livada Noastra pentru intrebari despre suc de mere natural, comenzi, livrare, colaborari si informatii despre produsele noastre din mere romanesti.',
    );
  }
}
