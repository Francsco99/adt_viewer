import './index.scss';

import { AdtViewerPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new AdtViewerPlugin();
}
export { AdtViewerPluginSetup, AdtViewerPluginStart } from './types';
