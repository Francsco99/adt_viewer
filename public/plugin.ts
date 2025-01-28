import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import { AdtViewerPluginSetup, AdtViewerPluginStart, AppPluginStartDependencies } from './types';
import { PLUGIN_NAME } from '../common';

export class AdtViewerPlugin implements Plugin<AdtViewerPluginSetup, AdtViewerPluginStart> {
  public setup(core: CoreSetup): AdtViewerPluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: 'adtViewer',
      title: PLUGIN_NAME,
      chromeless: true, //nascondi default navbar
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('adtViewer.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
  }

  public start(core: CoreStart): AdtViewerPluginStart {
    return {};
  }

  public stop() {}
}
