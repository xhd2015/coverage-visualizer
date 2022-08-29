export function toValuesTree(properties: any, conflictReporter: any): any;
export function addToValueTree(settingsTreeRoot: any, key: any, value: any, conflictReporter: any): void;
export function removeFromValueTree(valueTree: any, key: any): void;
/**
 * A helper function to get the configuration value with a specific settings path (e.g. config.some.setting)
 */
export function getConfigurationValue(config: any, settingPath: any, defaultValue: any): any;
export function getConfigurationKeys(): string[];
export function getDefaultValues(): any;
export function overrideIdentifierFromKey(key: any): any;
export function getMigratedSettingValue(configurationService: any, currentSettingName: any, legacySettingName: any): any;
export const IConfigurationService: any;
