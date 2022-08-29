/**
 * @returns A filter which combines the provided set
 * of filters with an or. The *first* filters that
 * matches defined the return value of the returned
 * filter.
 */
export function or(...args: any[]): (word: any, wordToMatchAgainst: any) => any;
export function matchesContiguousSubString(word: any, wordToMatchAgainst: any): {
    start: any;
    end: any;
}[];
export function matchesSubString(word: any, wordToMatchAgainst: any): any;
export function isUpper(code: any): boolean;
export function matchesCamelCase(word: any, camelCaseWord: any): any;
export function matchesFuzzy(word: any, wordToMatchAgainst: any, enableSeparateSubstringMatching: any): any;
export function anyScore(pattern: any, lowPattern: any, _patternPos: any, word: any, lowWord: any, _wordPos: any): any[];
export function createMatches(score: any): {
    start: any;
    end: any;
}[];
export function isPatternInWord(patternLow: any, patternPos: any, patternLen: any, wordLow: any, wordPos: any, wordLen: any): boolean;
export function fuzzyScore(pattern: any, patternLow: any, patternStart: any, word: any, wordLow: any, wordStart: any, firstMatchCanBeWeak: any): any[];
export function fuzzyScoreGracefulAggressive(pattern: any, lowPattern: any, patternPos: any, word: any, lowWord: any, wordPos: any, firstMatchCanBeWeak: any): any[];
export const matchesPrefix: any;
export const FuzzyScore: any;
