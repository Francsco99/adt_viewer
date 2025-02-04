import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../src/core/server';

const fetch = require('node-fetch');

export function defineRoutes(router: IRouter) {
  /**
   * Route: /api/adt_viewer/trees_list
   * Description: Returns a list of available tree files from Flask.
   */
  router.get(
    {
      path: '/api/adt_viewer/trees_list',
      validate: false,
    },
    async (context, request, response) => {
      try {
        const flaskResponse = await fetch('http://panacea-app:5003/api/trees', {
          method: 'GET',
        });

        if (!flaskResponse.ok) {
          return response.notFound({
            body: 'Failed to fetch tree list from Flask.',
          });
        }

        const trees = await flaskResponse.json();
        return response.ok({ body: { trees } });
      } catch (error) {
        console.error('Failed to fetch trees list from Flask:', error);
        return response.internalError({
          body: 'An error occurred while fetching the trees list.',
        });
      }
    }
  );

  /**
   * Route: /api/adt_viewer/tree/{treeId}
   * Description: Fetches a specific tree by its ID from Flask.
   */
  router.get(
    {
      path: '/api/adt_viewer/tree/{treeId}',
      validate: {
        params: schema.object({
          treeId: schema.number(), // Tree ID as a number
        }),
      },
    },
    async (context, request, response) => {
      const { treeId } = request.params;

      try {
        const flaskResponse = await fetch(`http://panacea-app:5003/api/trees/${treeId}`, {
          method: 'GET',
        });

        if (!flaskResponse.ok) {
          return response.notFound({
            body: `Tree with ID "${treeId}" not found on Flask.`,
          });
        }

        const treeData = await flaskResponse.json();
        return response.ok({ body: treeData.content });
      } catch (error) {
        console.error(`Failed to fetch tree with ID "${treeId}" from Flask:`, error);
        return response.internalError({
          body: `An error occurred while loading the tree with ID "${treeId}".`,
        });
      }
    }
  );

  /**
   * Route: /api/adt_viewer/save_tree/{fileName}
   * Description: Saves a tree as a JSON object by sending a POST request to Flask.
   */
  router.post(
    {
      path: '/api/adt_viewer/save_tree/{fileName}',
      validate: {
        params: schema.object({
          fileName: schema.string({ minLength: 1 }), // Name of the file
        }),
        body: schema.object({}, { unknowns: 'allow' }), // Generic JSON content
      },
      options: {
        body: {
          parse: true,
          accepts: 'application/json',
        },
      },
    },
    async (context, request, response) => {
      const { fileName } = request.params;
      const treeData = request.body; // JSON content of the tree

      try {
        // Sends a POST request to the Flask server
        const flaskResponse = await fetch('http://panacea-app:5003/api/trees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fileName, content: treeData }),
        });

        if (!flaskResponse.ok) {
          const errorBody = await flaskResponse.text();
          return response.customError({
            statusCode: flaskResponse.status,
            body: `Flask Error: ${errorBody}`,
          });
        }

        const result = await flaskResponse.json();
        return response.ok({
          body: { message: `Tree ${fileName} saved successfully`, id: result.id },
        });
      } catch (error) {
        console.error('Error saving tree to Flask:', error);
        return response.internalError({
          body: 'An error occurred while saving the tree.',
        });
      }
    }
  );

  /**
   * Route: /api/adt_viewer/policies_list
   * Description: Returns a list of available policies from Flask.
   */
  router.get(
    {
      path: '/api/adt_viewer/policies_list',
      validate: false,
    },
    async (context, request, response) => {
      try {
        const flaskResponse = await fetch('http://panacea-app:5003/api/policies', {
          method: 'GET',
        });

        if (!flaskResponse.ok) {
          return response.notFound({
            body: 'Failed to fetch policies list from Flask.',
          });
        }

        const policies = await flaskResponse.json();
        return response.ok({ body: { policies } });
      } catch (error) {
        console.error('Failed to fetch policies list from Flask:', error);
        return response.internalError({
          body: 'An error occurred while fetching the policies list.',
        });
      }
    }
  );

  /**
   * Route: /api/adt_viewer/load_policy/{policyId}
   * Description: Fetches a specific policy by its ID from Flask.
   */
  router.get(
    {
      path: '/api/adt_viewer/load_policy/{policyId}',
      validate: {
        params: schema.object({
          policyId: schema.number(), // Policy ID as a number
        }),
      },
    },
    async (context, request, response) => {
      const { policyId } = request.params;

      try {
        const flaskResponse = await fetch(`http://panacea-app:5003/api/policies/${policyId}`, {
          method: 'GET',
        });

        if (!flaskResponse.ok) {
          return response.notFound({
            body: `Policy with ID "${policyId}" not found on Flask.`,
          });
        }

        const policyData = await flaskResponse.json();
        return response.ok({ body: policyData.content });
      } catch (error) {
        console.error(`Failed to fetch policy with ID "${policyId}" from Flask:`, error);
        return response.internalError({
          body: `An error occurred while loading the policy with ID "${policyId}".`,
        });
      }
    }
  );

  /**
   * Route: /api/adt_viewer/save_policy/{fileName}
   * Description: Saves a policy as a JSON object by sending a POST request to Flask.
   */
  router.post(
    {
      path: '/api/adt_viewer/save_policy/{fileName}',
      validate: {
        params: schema.object({
          fileName: schema.string({ minLength: 1 }), // Name of the file
        }),
        body: schema.object({}, { unknowns: 'allow' }), // Generic JSON content
      },
      options: {
        body: {
          parse: true,
          accepts: 'application/json',
        },
      },
    },
    async (context, request, response) => {
      const { fileName } = request.params;
      const policyData = request.body; // JSON content of the policy

      try {
        // Sends a POST request to the Flask server
        const flaskResponse = await fetch('http://panacea-app:5003/api/policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fileName, content: policyData }),
        });

        if (!flaskResponse.ok) {
          const errorBody = await flaskResponse.text();
          return response.customError({
            statusCode: flaskResponse.status,
            body: `Flask Error: ${errorBody}`,
          });
        }

        const result = await flaskResponse.json();
        return response.ok({
          body: { message: `Policy ${fileName} saved successfully`, id: result.id },
        });
      } catch (error) {
        console.error('Error saving policy to Flask:', error);
        return response.internalError({
          body: 'An error occurred while saving the policy.',
        });
      }
    }
  );
}
