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

  router.get(
    {
      path: '/api/adt_viewer/policies_list',
      validate: false,
    },
    async (context, request, response) => {
      const directoryPath = path.resolve(__dirname, '../data/policies');
      const files = fs.readdirSync(directoryPath).filter((file) => file.endsWith('.json'));
      
      return response.ok({
        body: { policies: files },
      });
    }
  );

  router.get(
    {
      path: '/api/adt_viewer/policy',
      validate: false,
    },
    async (context, request, response) => {
      const filePath = path.resolve(__dirname, '../data/policies/policy.json');
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const policyData = JSON.parse(fileContent);
        return response.ok({
          body: policyData,
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
      path: '/api/adt_viewer/load_policy/{policyName}',
      validate: false, // Disabilita la validazione per gestire manualmente i tipi
    },
    async (context, request, response) => {
      try {
        // Ottieni il nome del file dal percorso URL
        const pathname = request.url.pathname; // Esempio: "/api/adt_viewer/load_policy/policy_1.json"
        const segments = pathname.split('/'); // Divide il percorso in segmenti
        const policyName = segments[segments.length - 1]; // Prende l'ultimo segmento
  
        // Verifica che il parametro `policyName` sia valido
        if (!policyName || typeof policyName !== 'string') {
          console.error('Invalid or missing policyName parameter');
          return response.badRequest({ body: 'Policy name is required and must be a string' });
        }
  
        console.log('Policy name extracted:', policyName);
  
        // Continua con la logica del caricamento della policy
        const filePath = path.resolve(__dirname, '../data/policies', policyName);
  
        if (!fs.existsSync(filePath)) {
          return response.notFound({ body: `Policy file not found: ${filePath}` });
        }
  
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const states = JSON.parse(fileContent);
  
        console.log(`Policy ${policyName} loaded successfully.`);
  
        return response.ok({
          body: states,
        });
      } catch (error) {
        console.error('Error loading policy:', error);
        return response.internalError({ body: 'An error occurred while loading the policy.' });
      }
    }
  );
  
  router.post(
    {
      path: "/api/adt_viewer/save_policy/{filename}",
      validate: false,
      options:{
        body:{
          parse: true,
          accepts:"application/json",
        }
      }
    },
    async (context, request, response) => {
      const pathname = request.url.pathname; // Esempio: "/api/adt_viewer/load_policy/policy_1.json"
      const segments = pathname.split('/'); // Divide il percorso in segmenti
      const filename = segments[segments.length - 1]; // Prende l'ultimo segmento
      //console.log(request);
      console.log(request.body);
      const filePath = path.resolve(__dirname, "../data/policies", filename);
  
      try {
        const policyData = request.body;
        console.log(request);
        fs.writeFileSync(filePath, JSON.stringify(policyData, null, 2), "utf8");
        return response.ok({
          body: { message: `Policy saved as ${filename}` },
        });
      } catch (error) {
        console.log(request);
        console.log(error);
        return response.internalError({
          body: "Failed to save policy",
        });
      }
    }
  );
  

}
