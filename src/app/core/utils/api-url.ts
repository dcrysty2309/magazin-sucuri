export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const { protocol, hostname } = window.location;

  return `${protocol}//${hostname}:4300${normalizedPath}`;
}
