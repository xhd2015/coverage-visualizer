export function deepClone(obj: any): any;
export function deepFreeze(obj: any): any;
export function cloneAndChange(obj: any, changer: any): any;
/**
 * Copies all properties of source into destination. The optional parameter "overwrite" allows to control
 * if existing properties on the destination should be overwritten or not. Defaults to true (overwrite).
 */
export function mixin(destination: any, source: any, overwrite: any): any;
export function assign(destination: any, ...args: any[]): any;
export function equals(one: any, other: any): boolean;
export function getOrDefault(obj: any, fn: any, defaultValue: any): any;
