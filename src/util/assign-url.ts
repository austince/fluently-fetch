import { URL } from 'url';

interface URLParts {
  hash?: string;
  host?: string;
  hostname?: string;
  href?: string;
  origin?: string;
  password?: string;
  pathname?: string;
  port?: string;
  protocol?: string;
  search?: string;
  searchParams?: URLSearchParams;
  username?: string;
}

/**
 * Build a URL from parts.
 */
export default (url: string, parts: URLParts): string => Object.assign(new URL(url), parts).toString()
