import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export interface AdtViewerPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AdtViewerPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
