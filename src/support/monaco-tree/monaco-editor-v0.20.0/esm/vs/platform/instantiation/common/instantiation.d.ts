/**
 * A *only* valid way to create a {{ServiceIdentifier}}.
 */
export function createDecorator(serviceId: any): any;
/**
 * Mark a service dependency as optional.
 */
export function optional(serviceIdentifier: any): (target: any, key: any, index: any, ...args: any[]) => void;
export const _util: any;
export const IInstantiationService: any;
