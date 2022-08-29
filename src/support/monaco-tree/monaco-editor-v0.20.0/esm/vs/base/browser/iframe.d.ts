export function IframeUtils(): void;
export namespace IframeUtils {
    /**
     * Returns a chain of embedded windows with the same origin (which can be accessed programmatically).
     * Having a chain of length 1 might mean that the current execution environment is running outside of an iframe or inside an iframe embedded in a window with a different origin.
     * To distinguish if at one point the current execution environment is running inside a window with a different origin, see hasDifferentOriginAncestor()
     */
    function getSameOriginWindowChain(): any;
    /**
     * Returns true if the current execution environment is chained in a list of iframes which at one point ends in a window with a different origin.
     * Returns false if the current execution environment is not running inside an iframe or if the entire chain of iframes have the same origin.
     */
    function hasDifferentOriginAncestor(): boolean;
    /**
     * Returns the position of `childWindow` relative to `ancestorWindow`
     */
    function getPositionOfChildWindowRelativeToAncestorWindow(childWindow: any, ancestorWindow: any): {
        top: number;
        left: number;
    };
}
