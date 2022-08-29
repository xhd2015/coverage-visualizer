export function getZoomLevel(): number;
/** Returns the time (in ms) since the zoom level was changed */
export function getTimeSinceLastZoomLevelChanged(): number;
export function onDidChangeZoomLevel(callback: any): any;
export function getPixelRatio(): number;
export const isIE: boolean;
export const isEdge: boolean;
export const isEdgeOrIE: boolean;
export const isFirefox: boolean;
export const isWebKit: boolean;
export const isChrome: boolean;
export const isSafari: boolean;
export const isWebkitWebView: boolean;
export const isIPad: boolean;
export const isEdgeWebView: boolean;
export const isStandalone: boolean;
