import { environment } from '../../../environments/environment';

export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${environment.apiBaseUrl}${normalizedPath}`;
}
