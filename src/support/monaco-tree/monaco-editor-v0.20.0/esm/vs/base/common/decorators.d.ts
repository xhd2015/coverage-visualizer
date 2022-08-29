export function createMemoizer(): {
    (target: any, key: any, descriptor: any): void;
    clear(): void;
};
export function memoize(target: any, key: any, descriptor: any): void;
