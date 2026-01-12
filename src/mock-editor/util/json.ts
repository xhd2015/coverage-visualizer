import JSONBigInt from 'json-bigint';

const { parse: JSONBigIntParse, stringify: JSONBigIntStringify } = JSONBigInt({
    protoAction: 'preserve',
    constructorAction: 'preserve'
})

export function parseJSONObjectSafe(code: string): any {
    return JSONBigIntParse(code)
}

export function prettyJSONObjectSafe(object: any): string {
    return JSONBigIntStringify(object, null, "    ")
}

export function compressJSONObjectSafe(object: any): string {
    return JSONBigIntStringify(object)
}
