// standard data

export interface TestingCase {
    Request: object;
    Mock: MockData;
    Skip: boolean;
    Asserts: { [key: string]: string }
    AssertError: string;
    AssertMockRecord: object; // deprecated
    Comment: string;
}

export interface MockData {
    Mapping: {
        [pkg: string]: {
            [func: string]: {
                Comment?: string
                Error?: string
                Resp?: any // Resp needs to be type-parsed against the server type
                // examples are: string, {"Resp_0":"","Resp_1":""}
                RespNull?: boolean
            }
        }
    }
}

export function serializeMockData(data: MockData): MockData {
    return mapObj(data, (pkgMapping: MockData["Mapping"]) => {
        return mapObj(pkgMapping, (funcMapping: typeof pkgMapping[""]) => {
            return mapObj(funcMapping, (funcInfo: typeof funcMapping[""]) => {
                if (!funcInfo?.Resp || typeof funcInfo?.Resp !== 'string') {
                    return funcInfo
                }
                const respTrim = funcInfo.Resp.trimStart()
                if (respTrim.startsWith("{") || respTrim.startsWith("[")) {
                    try {
                        funcInfo.Resp = JSON.parse(respTrim)
                    } catch (x) {
                        // ignore
                    }
                }
                return funcInfo
            })
        })
    })
}
function mapObj<T, V extends Object>(o: V, fn: (v: T) => T): V {
    const n = { ...o }
    for (let k in (o || {})) {
        n[k] = fn(o[k])
    }
    return n
}

export type RunStatus = "not_run" | "success" | "fail" | "error" | "running" | "skip";
export const allStatus: RunStatus[] = ["success", "fail", "error", "skip", "running", "not_run"]

// deprecated, use v2
export interface TestingResponse {
    response: string;
    responseError: string;
    assertResult: AssertResult;
    mockRecord: string;
    runStatus: RunStatus;
}
// export interface AssertResult {
//     success: boolean;
//     fails?: any[];
//     assert_mock_record_fails?: any[];
// }

export const runStatusMapping: Record<RunStatus, { color: string, icon: string }> = {
    "": {
        color: "grey",
        icon: "mdi-checkbox-blank-circle-outline",
    },
    not_run: {
        color: "grey",
        icon: "mdi-checkbox-blank-circle-outline",
    },
    skip: {
        color: "grey",
        icon: "mdi-information-outline",
    },
    running: {
        color: "blue",
        icon: "mdi-progress-clock",
    },
    success: {
        color: "green",
        icon: "mdi-check-circle-outline",
    },
    error: {
        color: "orange",
        icon: "mdi-alert-circle-outline",
    },
    fail: {
        color: "red",
        icon: "mdi-close-circle-outline",
    },
};

export function getStatusMapping(status) {
    return runStatusMapping[status] || runStatusMapping.not_run;
}



export interface TestingRequestV2 {
    region: string
    env: string

    request: string | Object

    // deprecated, use mockData
    mock: string | Object

    mockData?: string | Object // for localhost, 

    service: string
    method: string
    endpoint: string

    assertIsErr?: boolean
    assertError?: string
    asserts?: string | Object
    assertMockRecord?: string | object
}

// copied
export interface TestingResponseV2<T> {
    Response: object
    MockRecord: object
    Error?: string
    AssertResult?: AssertResult
    RequestID?: string
    Extension: {
        Data: T
    }
}

export interface AssertResult {
    success: boolean
    fails?: FailDetail[]
}
export interface FailDetail {
    type: 'response' | 'mock_record' | 'error' | 'no_assert' | 'bad_syntax'
    expectErr?: string
    actualErr?: string
    field?: string
    expectValue?: string
    actualValue?: string
    str: string
}

// mock info
export interface MockInfo {
    BuildInfo: BuildInfo
    Stubs: MockStubRegistry
    Types: { [key: string]: Type }
}
export interface BuildInfo {
    MainModule: string
}
export interface MockStubRegistry {
    PkgMapping: { [pkgName: string]: PkgRegistry }
}
export interface PkgRegistry {
    FuncMapping: { [ownerTypeName: string]: { [funcName: string]: FuncInfo } }
}
export interface FuncInfo {
    Args: Field[]
    Results: Field[]
}
export interface Field {
    Name: string
    Type: Type
    Default?: any // response have Default
}
export interface Type {
    uri?: string
    "$ref"?: string
    type: string // string,integer,number, object
    properties?: { [key: string]: Type } // for object
    patternProperties?: { [key: string]: Type }  // for map
    items?: Type // for array,slice

    default?: any

    definitions?: { [key: string]: Type } // root only
}



// Schema used by monaco
export interface Schema {
    uri: string,
    fileMatch?: string[],
    schema: Type
}
export interface SchemaResult {
    schemas: Schema[],

    replace?: (s: string) => string
}
export interface SchemaResultV2 extends SchemaResult {
    PkgMapping: { [pkgName: string]: PkgRegistry2 }
}


export interface PkgRegistry2 {
    FuncMapping: { [ownerTypeName: string]: { [funcName: string]: FuncInfo } }
}
export interface FuncInfo {
    Args: Field[]
    Results: Field[]
}

// a list of schemas
export function buildJSONSchema(mockInfo: MockInfo): SchemaResult {
    const schemas: Schema[] = []

    const mainModule = mockInfo?.BuildInfo?.MainModule || ""
    const mainEllipses = mainModule && mainModule.length > 4 && (mainModule[0] + "...")
    const replace = createReplacer('"' + mainEllipses, '"' + mainModule)

    // common prefix
    const pkgMapping: { [name: string]: Type } = {}
    const pkgMappingList: { [name: string]: Type } = {}
    Object.keys(mockInfo?.Stubs?.PkgMapping || {}).forEach(k => {
        let use = k
        if (mainEllipses && k.startsWith(mainModule)) {
            use = mainEllipses + k.slice(mainModule.length)
        }

        const funcProperties = {}
        const funcPropertiesList: { [name: string]: Type } = {}
        const funcMapping = mockInfo.Stubs?.PkgMapping[k].FuncMapping || {}
        Object.keys(funcMapping).forEach(o => {
            Object.keys(funcMapping[o] || {}).forEach(fn => {
                let name = fn
                if (o) {
                    name = o + "." + fn
                }

                const respType = buildRespErrFields(funcMapping[o][fn]?.Results)
                funcProperties[name] = respType
                funcPropertiesList[name] = {
                    type: "array",
                    items: respType,
                }
            })
        })
        pkgMapping[k] = {
            type: "object",
            properties: funcProperties,
        }
        pkgMapping[use] = {
            type: "object"
        }

        pkgMappingList[k] = {
            type: "object",
            properties: funcProperties,
        }
        pkgMappingList[use] = {
            type: "object"
        }
    })
    const rootType: Type = {
        type: "object",
        uri: "", // not necessary
        properties: {
            Mapping: {
                type: "object",
                properties: pkgMapping,
            },
            MappingList: {
                type: "object",
                properties: pkgMappingList,
            }
        },
    }
    schemas.push({ uri: rootType.uri || "", schema: rootType })
    if (mockInfo?.Types) {
        for (let k in mockInfo.Types) {
            const t = mockInfo.Types[k]
            schemas.push({ uri: t.uri || "", schema: t })
        }
    }
    return {
        schemas: schemas,
        replace,
    }
}

type SchemaMapping = { [pkg: string]: SchemaPkgMapping }
type SchemaPkgMapping = { [func: string]: SchemaResult }
export function buildRespJSONSchemaMapping(mockInfo: MockInfo): SchemaMapping {
    const schemas: Schema[] = []
    if (mockInfo?.Types) {
        for (let k in mockInfo.Types) {
            const t = mockInfo.Types[k]
            schemas.push({ uri: t.uri || "", schema: t })
        }
    }

    const res: SchemaMapping = {}
    Object.keys(mockInfo?.Stubs?.PkgMapping || {}).forEach(pkg => {
        const pkgRespMapping: SchemaPkgMapping = {}

        const funcMapping = mockInfo.Stubs?.PkgMapping?.[pkg]?.FuncMapping || {}
        Object.keys(funcMapping).forEach(owner => {
            Object.keys(funcMapping[owner] || {}).forEach(funcName => {
                let jointName = funcName
                if (owner) {
                    jointName = owner + "." + funcName
                }
                const respType = buildRespFields(funcMapping[owner]?.[funcName]?.Results)
                pkgRespMapping[jointName] = {
                    schemas: [
                        {
                            uri: "",
                            schema: respType
                        },
                        ...schemas,
                    ]
                }
            })
        })

        res[pkg] = pkgRespMapping
    })
    return res
}

export function buildRespFields(respFields: Field[]): Type {
    if (!respFields?.length) {
        return undefined
    }
    if (respFields?.length === 1) {
        return {
            ...respFields[0].Type,
            default: respFields[0].Default,
        }
    } else {
        const resps = {}
        const defs = {}
        respFields.forEach(res => {
            resps[res.Name] = res.Type
            defs[res.Name] = res.Default
        })
        return {
            type: "object",
            properties: resps,
            default: defs,
        }
    }
}
export function buildRespErrFields(respFields: Field[]): Type {
    respFields = respFields || []
    const respType = buildRespFields(respFields)
    let respProperties = respType ? { "Resp": respType } : undefined

    return {
        type: "object",
        properties: {
            ...respProperties,
            "Error": {
                type: "string"
            }
        }
    }
}

export function createReplacer(prefix, real): (string) => string {
    if (prefix) {
        return (s) => {
            if (s?.startsWith?.(prefix)) {
                return real + s.slice(prefix.length)
            }
        }
    }
    return (s) => {
        return "" // no replace
    }
}