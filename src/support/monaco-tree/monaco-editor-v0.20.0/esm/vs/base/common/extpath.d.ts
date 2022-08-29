/**
 * Takes a Windows OS path and changes backward slashes to forward slashes.
 * This should only be done for OS paths from Windows (or user provided paths potentially from Windows).
 * Using it on a Linux or MaxOS path might change it.
 */
export function toSlashes(osPath: any): any;
export function isEqualOrParent(path: any, candidate: any, ignoreCase: any, separator: any): boolean;
export function isWindowsDriveLetter(char0: any): boolean;
