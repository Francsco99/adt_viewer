import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { AdtViewerPluginSetup, AdtViewerPluginStart } from './types';
import { defineRoutes } from './routes';

export class AdtViewerPlugin implements Plugin<AdtViewerPluginSetup, AdtViewerPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('adt_viewer: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('adt_viewer: Started');
    return {};
  }

  public stop() {}
}
