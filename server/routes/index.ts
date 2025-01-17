import path from 'path';
import fs from 'fs/promises'; // Utilizzo della versione async di fs
import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../src/core/server';

/**
 * Funzione helper per leggere un file JSON.
 * @param filePath Il percorso del file da leggere.
 * @returns Il contenuto del file JSON come oggetto.
 */
async function readJsonFile(filePath: string): Promise<any> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Failed to read file at ${filePath}:`, error instanceof Error ? error.message : error);
    throw new Error('Failed to read the file');
  }
}

/**
 * Funzione helper per scrivere dati in un file JSON.
 * @param filePath Il percorso del file in cui scrivere.
 * @param data I dati da scrivere nel file.
 */
async function writeJsonFile(filePath: string, data: object): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Failed to write file at ${filePath}:`, error instanceof Error ? error.message : error);
    throw new Error('Failed to write the file');
  }
}

export function defineRoutes(router: IRouter) {
  /**
   * Route: /api/adt_viewer/trees_list
   * Descrizione: Restituisce un elenco di file di alberi disponibili.
   */
  router.get(
    {
      path: '/api/adt_viewer/trees_list',
      validate: false,
    },
    async (context, request, response) => {
      const directoryPath = path.resolve(__dirname, '../data/trees');
      try {
        const files = await fs.readdir(directoryPath);
        const jsonFiles = files.filter((file) => file.endsWith('.json'));
        return response.ok({ body: { trees: jsonFiles } });
      } catch (error) {
        return response.internalError({
          body: 'An error occurred while retrieving the trees list.',
        });
      }
    }
  );

  /**
   * Route: /api/adt_viewer/tree/{treeName}
   * Descrizione: Carica un albero specifico dal file system.
   */
  router.get(
    {
      path: '/api/adt_viewer/tree/{treeName}',
      validate: {
        params: schema.object({
          treeName: schema.string({ minLength: 1 }),
        }),
      },
    },
    async (context, request, response) => {
      const { treeName } = request.params;
      const safeFileName = path.basename(treeName);
      const filePath = path.resolve(__dirname, '../data/trees', safeFileName);

      try {
        const treeData = await readJsonFile(filePath);
        return response.ok({ body: treeData });
      } catch (error) {
        if (error instanceof Error && error.message.includes('ENOENT')) {
          return response.notFound({
            body: `The requested tree "${treeName}" does not exist.`,
          });
        }
        return response.internalError({
          body: 'An error occurred while loading the tree.',
        });
      }
    }
  );

  /**
  * Route: /api/adt_viewer/save_tree/{filename}
  * Descrizione: Salva un file JSON specifico nella directory server/data/trees.
  */
  router.post(
    {
      path: '/api/adt_viewer/save_tree/{filename}',
      validate: {
        params: schema.object({
          filename: schema.string({ minLength: 1 }),
        }),
        body: schema.object({}, { unknowns: 'allow' }),
      },
      options: {
        body: {
          parse: true,
          accepts: 'application/json',
        },
      },
    },
    async (context, request, response) => {
      const { filename } = request.params;
      const safeFileName = path.basename(filename); // Protezione contro il path traversal
      const filePath = path.resolve(__dirname, '../data/trees', safeFileName); // Salva nella directory server/data/actions

      try {
        // Salva i dati JSON nel file specificato
        await writeJsonFile(filePath, request.body);

        return response.ok({
          body: { message: `File saved as ${safeFileName}` },
        });
      } catch (error) {
        return response.internalError({
          body: 'An error occurred while saving the file.',
        });
      }
    }
  );

  /**
   * Route: /api/adt_viewer/policies_list
   * Descrizione: Restituisce un elenco di file di policy disponibili.
   */
  router.get(
    {
      path: '/api/adt_viewer/policies_list',
      validate: false,
    },
    async (context, request, response) => {
      const directoryPath = path.resolve(__dirname, '../data/policies');
      try {
        const files = await fs.readdir(directoryPath);
        const jsonFiles = files.filter((file) => file.endsWith('.json'));
        return response.ok({ body: { policies: jsonFiles } });
      } catch (error) {
        return response.internalError({
          body: 'An error occurred while retrieving the policies list.',
        });
      }
    }
  );

  /**
   * Route: /api/adt_viewer/load_policy/{policyName}
   * Descrizione: Carica una specifica policy dal file system.
   */
  router.get(
    {
      path: '/api/adt_viewer/load_policy/{policyName}',
      validate: {
        params: schema.object({
          policyName: schema.string({ minLength: 1 }),
        }),
      },
    },
    async (context, request, response) => {
      const { policyName } = request.params;
      const safeFileName = path.basename(policyName);
      const filePath = path.resolve(__dirname, '../data/policies', safeFileName);

      try {
        const policyData = await readJsonFile(filePath);
        return response.ok({ body: policyData });
      } catch (error) {
        if (error instanceof Error && error.message.includes('ENOENT')) {
          return response.notFound({
            body: `The requested policy "${policyName}" does not exist.`,
          });
        }
        return response.internalError({
          body: 'An error occurred while loading the policy.',
        });
      }
    }
  );

  /**
   * Route: /api/adt_viewer/save_policy/{filename}
   * Descrizione: Salva una policy nel file system.
   */
  router.post(
    {
      path: '/api/adt_viewer/save_policy/{filename}',
      validate: {
        params: schema.object({
          filename: schema.string({ minLength: 1 }),
        }),
        body: schema.object({}, { unknowns: 'allow' }),
      },
      options: {
        body: {
          parse: true,
          accepts: 'application/json',
        },
      },
    },
    async (context, request, response) => {
      const { filename } = request.params;
      const safeFileName = path.basename(filename);
      const filePath = path.resolve(__dirname, '../data/policies', safeFileName);

      try {
        await writeJsonFile(filePath, request.body);
        return response.ok({
          body: { message: `Policy saved as ${filename}` },
        });
      } catch (error) {
        return response.internalError({
          body: 'An error occurred while saving the policy.',
        });
      }
    }
  ); 

}
