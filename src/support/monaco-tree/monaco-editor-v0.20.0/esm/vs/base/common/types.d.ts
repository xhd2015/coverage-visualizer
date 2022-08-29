/**
 * @returns whether the provided parameter is a JavaScript Array or not.
 */
export function isArray(array: any): boolean;
/**
 * @returns whether the provided parameter is a JavaScript String or not.
 */
export function isString(str: any): boolean;
/**
 *
 * @returns whether the provided parameter is of type `object` but **not**
 *	`null`, an `array`, a `regexp`, nor a `date`.
 */
export function isObject(obj: any): boolean;
/**
 * In **contrast** to just checking `typeof` this will return `false` for `NaN`.
 * @returns whether the provided parameter is a JavaScript Number or not.
 */
export function isNumber(obj: any): boolean;
/**
 * @returns whether the provided parameter is a JavaScript Boolean or not.
 */
export function isBoolean(obj: any): boolean;
/**
 * @returns whether the provided parameter is undefined.
 */
export function isUndefined(obj: any): boolean;
/**
 * @returns whether the provided parameter is undefined or null.
 */
export function isUndefinedOrNull(obj: any): boolean;
export function assertType(condition: any, type: any): void;
/**
 * @returns whether the provided parameter is an empty JavaScript Object or not.
 */
export function isEmptyObject(obj: any): boolean;
/**
 * @returns whether the provided parameter is a JavaScript Function or not.
 */
export function isFunction(obj: any): boolean;
export function validateConstraints(args: any, constraints: any): void;
export function validateConstraint(arg: any, constraint: any): void;
export function getAllPropertyNames(obj: any): any[];
export function getAllMethodNames(obj: any): any[];
export function createProxyObject(methodNames: any, invoke: any): {};
/**
 * Converts null to undefined, passes all other values through.
 */
export function withNullAsUndefined(x: any): any;
/**
 * Converts undefined to null, passes all other values through.
 */
export function withUndefinedAsNull(x: any): any;
