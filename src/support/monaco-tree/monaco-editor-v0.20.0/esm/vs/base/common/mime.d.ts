/**
 * Associate a text mime to the registry.
 */
export function registerTextMime(association: any, warnOnOverwrite: any): void;
/**
 * Given a file, return the best matching mime type for it
 */
export function guessMimeTypes(resource: any, firstLine: any): any[];
export const MIME_TEXT: string;
export const MIME_UNKNOWN: string;
