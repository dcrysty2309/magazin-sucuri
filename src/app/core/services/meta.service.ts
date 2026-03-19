import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MetaService {
  setPageTitle(title: string): void {
    document.title = `${title} | Livada Noastra`;
  }

  setDescription(description: string): void {
    let element = document.querySelector('meta[name="description"]');

    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('name', 'description');
      document.head.appendChild(element);
    }

    element.setAttribute('content', description);
  }
}
