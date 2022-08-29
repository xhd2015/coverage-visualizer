export function hasToIgnoreCase(resource: any): boolean;
export function basenameOrAuthority(resource: any): any;
/**
 * Tests wheter the two authorities are the same
 */
export function isEqualAuthority(a1: any, a2: any): boolean;
export function isEqual(first: any, second: any, ignoreCase: any): boolean;
export function basename(resource: any): any;
/**
 * Return a URI representing the directory of a URI path.
 *
 * @param resource The input URI.
 * @returns The URI representing the directory of the input URI.
 */
export function dirname(resource: any): any;
/**
 * Join a URI path with path fragments and normalizes the resulting path.
 *
 * @param resource The input URI.
 * @param pathFragment The path fragment to add to the URI path.
 * @returns The resulting URI.
 */
export function joinPath(resource: any, ...args: any[]): any;
/**
 * Normalizes the path part of a URI: Resolves `.` and `..` elements with directory names.
 *
 * @param resource The URI to normalize the path.
 * @returns The URI with the normalized path.
 */
export function normalizePath(resource: any): any;
/**
 * Returns the fsPath of an URI where the drive letter is not normalized.
 * See #56403.
 */
export function originalFSPath(uri: any): any;
/**
 * Returns a relative path between two URIs. If the URIs don't have the same schema or authority, `undefined` is returned.
 * The returned relative path always uses forward slashes.
 */
export function relativePath(from: any, to: any, ignoreCase: any): any;
/**
 * Data URI related helpers.
 */
export const DataUri: any;
