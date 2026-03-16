import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MetaService {
  setPageTitle(title: string): void {
    document.title = `${title} | Livada Noastra`;
  }
}
