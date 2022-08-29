/**
 * Returns the last element of an array.
 * @param array The array.
 * @param n Which element from the end (default is zero).
 */
export function tail(array: any, n: any): any;
export function tail2(arr: any): any[];
export function equals(one: any, other: any, itemEquals: any): boolean;
export function binarySearch(array: any, key: any, comparator: any): number;
/**
 * Takes a sorted array and a function p. The array is sorted in such a way that all elements where p(x) is false
 * are located before all elements where p(x) is true.
 * @returns the least x for which p(x) is true or array.length if no element fullfills the given function.
 */
export function findFirstInSorted(array: any, p: any): number;
/**
 * Like `Array#sort` but always stable. Usually runs a little slower `than Array#sort`
 * so only use this when actually needing stable sort.
 */
export function mergeSort(data: any, compare: any): any;
export function groupBy(data: any, compare: any): any[][];
/**
 * @returns New array with all falsy values removed. The original array IS NOT modified.
 */
export function coalesce(array: any): any;
/**
 * @returns false if the provided object is an array and not empty.
 */
export function isFalsyOrEmpty(obj: any): boolean;
export function isNonEmptyArray(obj: any): boolean;
/**
 * Removes duplicates from the given array. The optional keyFn allows to specify
 * how elements are checked for equalness by returning a unique string for each.
 */
export function distinct(array: any, keyFn: any): any;
export function distinctES6(array: any): any;
export function fromSet(set: any): any[];
export function firstIndex(array: any, fn: any): number;
export function first(array: any, fn: any, notFoundValue: any): any;
export function firstOrDefault(array: any, notFoundValue: any): any;
export function flatten(arr: any): any;
export function range(arg: any, to: any): any[];
/**
 * Insert `insertArr` inside `target` at `insertIndex`.
 * Please don't touch unless you understand https://jsperf.com/inserting-an-array-within-an-array
 */
export function arrayInsert(target: any, insertIndex: any, insertArr: any): any;
/**
 * Pushes an element to the start of the array, if found.
 */
export function pushToStart(arr: any, value: any): void;
/**
 * Pushes an element to the end of the array, if found.
 */
export function pushToEnd(arr: any, value: any): void;
export function find(arr: any, predicate: any): any;
export function asArray(x: any): any[];
