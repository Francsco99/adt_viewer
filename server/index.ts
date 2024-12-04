import { PluginInitializerContext } from '../../../src/core/server';
import { AdtViewerPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new AdtViewerPlugin(initializerContext);
}

export { AdtViewerPluginSetup, AdtViewerPluginStart } from './types';
