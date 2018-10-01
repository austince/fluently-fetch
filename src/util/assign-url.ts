import { URL } from 'url';

/**
 * Build a URL from parts.
 */
export default (url: string, parts: URL): string => Object.assign(new URL(url), parts).toString()
