import path from 'path';
import fs from 'fs';
import { IRouter } from '../../../../src/core/server';

export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: '/api/adt_viewer/example',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          time: new Date().toISOString(),
        },
      });
    }
  );

  router.get(
    {
      path: '/api/adt_viewer/tree',
      validate: false,
    },
    async (context, request, response) => {
      const filePath = path.resolve(__dirname, '../data/attack_tree.json');
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const treeData = JSON.parse(fileContent);
        return response.ok({
          body: treeData,
        });
      } catch (error) {
        return response.internalError({
          body: 'Failed to read attack tree data',
        });
      }
    }
  );

  router.get(
    {
      path: '/api/adt_viewer/tree_states',
      validate: false,
    },
    async (context, request, response) => {
      const filePath = path.resolve(__dirname, '../data/tree_states.json');
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const statesData = JSON.parse(fileContent);
        return response.ok({
          body: statesData,
        });
      } catch (error) {
        return response.internalError({
          body: 'Failed to read tree states data',
        });
      }
    }
  );

  router.get(
    {
      path: '/api/adt_viewer/policy',
      validate: false,
    },
    async (context, request, response) => {
      const filePath = path.resolve(__dirname, '../data/policy.json');
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const statesData = JSON.parse(fileContent);
        return response.ok({
          body: statesData,
        });
      } catch (error) {
        return response.internalError({
          body: 'Failed to read tree states data',
        });
      }
    }
  );

  router.get(
    {
      path: '/api/adt_viewer/actions',
      validate: false,
    },
    async (context, request, response) => {
      const filePath = path.resolve(__dirname, '../data/actions.json');
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const statesData = JSON.parse(fileContent);
        return response.ok({
          body: statesData,
        });
      } catch (error) {
        return response.internalError({
          body: 'Failed to read tree states data',
        });
      }
    }
  );
}
