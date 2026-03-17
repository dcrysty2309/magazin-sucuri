import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MetaService } from '../../../../core/services/meta.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
})
export class AboutPageComponent {
  private readonly metaService = inject(MetaService);

  constructor() {
    this.metaService.setPageTitle('Despre noi');
    this.metaService.setDescription(
      'Afla povestea brandului Livada Noastra si cum producem suc de mere natural, 100% natural, fara zahar adaugat si fara conservanti, din mere romanesti atent selectionate.',
    );
  }
}
