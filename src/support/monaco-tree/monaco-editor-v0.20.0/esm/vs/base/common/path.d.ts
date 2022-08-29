export namespace win32 {
    export { win32 };
    export { posix };
}
export namespace posix {
    export namespace win32_1 {
        export function resolve(...args: any[]): string;
        export function normalize(path: any): any;
        export function isAbsolute(path: any): boolean;
        export function join(...args: any[]): any;
        export function relative(from: any, to: any): string;
        export function toNamespacedPath(path: any): any;
        export function dirname(path: any): any;
        export function basename(path: any, ext: any): any;
        export function extname(path: any): any;
        export function format(pathObject: any): any;
        export function parse(path: any): {
            root: string;
            dir: string;
            base: string;
            ext: string;
            name: string;
        };
        export const sep: string;
        export const delimiter: string;
        const win32_2: any;
        export { win32_2 as win32 };
        const posix_1: any;
        export { posix_1 as posix };
    }
    export { win32_1 as win32 };
    export namespace posix_2 {
        export function resolve_1(...args: any[]): string;
        export { resolve_1 as resolve };
        export function normalize_1(path: any): any;
        export { normalize_1 as normalize };
        export function isAbsolute_1(path: any): boolean;
        export { isAbsolute_1 as isAbsolute };
        export function join_1(...args: any[]): any;
        export { join_1 as join };
        export function relative_1(from: any, to: any): any;
        export { relative_1 as relative };
        export function toNamespacedPath_1(path: any): any;
        export { toNamespacedPath_1 as toNamespacedPath };
        export function dirname_1(path: any): any;
        export { dirname_1 as dirname };
        export function basename_1(path: any, ext: any): any;
        export { basename_1 as basename };
        export function extname_1(path: any): any;
        export { extname_1 as extname };
        export function format_1(pathObject: any): any;
        export { format_1 as format };
        export function parse_1(path: any): {
            root: string;
            dir: string;
            base: string;
            ext: string;
            name: string;
        };
        export { parse_1 as parse };
        const sep_1: string;
        export { sep_1 as sep };
        const delimiter_1: string;
        export { delimiter_1 as delimiter };
        const win32_3: any;
        export { win32_3 as win32 };
        const posix_3: any;
        export { posix_3 as posix };
    }
    export { posix_2 as posix };
}
export function normalize(path: any): any;
export function join(...args: any[]): any;
export function relative(from: any, to: any): any;
export function dirname(path: any): any;
export function basename(path: any, ext: any): any;
export function extname(path: any): any;
export const sep: string;
