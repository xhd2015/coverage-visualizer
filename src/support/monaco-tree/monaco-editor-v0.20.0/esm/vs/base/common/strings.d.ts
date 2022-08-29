export function isFalsyOrWhitespace(str: any): boolean;
/**
 * @returns the provided number with the given number of preceding zeros.
 */
export function pad(n: any, l: any, char: any): string;
/**
 * Helper to produce a string with a variable number of arguments. Insert variable segments
 * into the string using the {n} notation where N is the index of the argument following the string.
 * @param value string to which formatting is applied
 * @param args replacements for {n}-entries
 */
export function format(value: any, ...args: any[]): any;
/**
 * Converts HTML characters inside the string to use entities instead. Makes the string safe from
 * being used e.g. in HTMLElement.innerHTML.
 */
export function escape(html: any): any;
/**
 * Escapes regular expression characters in a given string
 */
export function escapeRegExpCharacters(value: any): any;
/**
 * Removes all occurrences of needle from the beginning and end of haystack.
 * @param haystack string to trim
 * @param needle the thing to trim (default is a blank)
 */
export function trim(haystack: any, needle: any): any;
/**
 * Removes all occurrences of needle from the beginning of haystack.
 * @param haystack string to trim
 * @param needle the thing to trim
 */
export function ltrim(haystack: any, needle: any): any;
/**
 * Removes all occurrences of needle from the end of haystack.
 * @param haystack string to trim
 * @param needle the thing to trim
 */
export function rtrim(haystack: any, needle: any): any;
export function convertSimple2RegExpPattern(pattern: any): any;
/**
 * Determines if haystack starts with needle.
 */
export function startsWith(haystack: any, needle: any): boolean;
/**
 * Determines if haystack ends with needle.
 */
export function endsWith(haystack: any, needle: any): boolean;
export function createRegExp(searchString: any, isRegex: any, options: any): RegExp;
export function regExpLeadsToEndlessLoop(regexp: any): boolean;
export function regExpFlags(regexp: any): string;
/**
 * Returns first index of the string that is not whitespace.
 * If string is empty or contains only whitespaces, returns -1
 */
export function firstNonWhitespaceIndex(str: any): number;
/**
 * Returns the leading whitespace of the string.
 * If the string contains only whitespaces, returns entire string
 */
export function getLeadingWhitespace(str: any, start: any, end: any): any;
/**
 * Returns last index of the string that is not whitespace.
 * If string is empty or contains only whitespaces, returns -1
 */
export function lastNonWhitespaceIndex(str: any, startIndex: any): any;
export function compare(a: any, b: any): 1 | -1 | 0;
export function compareIgnoreCase(a: any, b: any): number;
export function isLowerAsciiLetter(code: any): boolean;
export function isUpperAsciiLetter(code: any): boolean;
export function equalsIgnoreCase(a: any, b: any): boolean;
export function startsWithIgnoreCase(str: any, candidate: any): boolean;
/**
 * @returns the length of the common prefix of the two strings.
 */
export function commonPrefixLength(a: any, b: any): number;
/**
 * @returns the length of the common suffix of the two strings.
 */
export function commonSuffixLength(a: any, b: any): number;
export function isHighSurrogate(charCode: any): boolean;
export function isLowSurrogate(charCode: any): boolean;
/**
 * get the code point that begins at offset `offset`
 */
export function getNextCodePoint(str: any, len: any, offset: any): any;
export function nextCharLength(str: any, offset: any): number;
export function prevCharLength(str: any, offset: any): number;
/**
 * Returns true if `str` contains any Unicode character that is classified as "R" or "AL".
 */
export function containsRTL(str: any): boolean;
export function containsEmoji(str: any): boolean;
/**
 * Returns true if `str` contains only basic ASCII characters in the range 32 - 126 (including 32 and 126) or \n, \r, \t
 */
export function isBasicASCII(str: any): boolean;
export function containsFullWidthCharacter(str: any): boolean;
export function isFullWidthCharacter(charCode: any): boolean;
/**
 * A fast function (therefore imprecise) to check if code points are emojis.
 * Generated using https://github.com/alexandrudima/unicode-utils/blob/master/generate-emoji-test.js
 */
export function isEmojiImprecise(x: any): boolean;
export function startsWithUTF8BOM(str: any): boolean;
export function safeBtoa(str: any): string;
export function repeat(s: any, count: any): string;
export function containsUppercaseCharacter(target: any, ignoreEscapedChars: any): boolean;
/**
 * Produces 'a'-'z', followed by 'A'-'Z'... followed by 'a'-'z', etc.
 */
export function singleLetterHash(n: any): string;
export function getGraphemeBreakType(codePoint: any): any;
export function breakBetweenGraphemeBreakType(breakTypeA: any, breakTypeB: any): boolean;
export const UTF8_BOM_CHARACTER: string;
