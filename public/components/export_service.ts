import { CoreStart } from "../../../../src/core/public";

interface ExportResponse {
  file_name: string;
  tree_data: object;
  policy_content: object;
}

/**
 * Exports JSON data to the server.
 * @param http HTTP object from CoreStart.
 * @param notifications Notifications object from CoreStart.
 * @param payload JSON object to send.
 * @returns A response containing `file_name`, `tree_data`, and `policy_content`.
 */
export async function exportData(
  http: CoreStart["http"],
  notifications: CoreStart["notifications"],
  payload: object // JSON only
): Promise<ExportResponse | null> {
  try {
    const response = await http.post("http://localhost:5002/receive_json", {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (
      !response ||
      typeof response !== "object" ||
      !response.file_name ||
      !response.tree_data ||
      !response.policy_content
    ) {
      throw new Error("Invalid response from server: missing required fields");
    }

    return response;
  } catch (error) {
    console.error("Error during export operation:", error);
    notifications.toasts.addDanger(
      `Error during export operation: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return null;
  }
}

/**
 * Uploads an XML file to the server.
 * @param http HTTP object from CoreStart.
 * @param notifications Notifications object from CoreStart.
 * @param file XML file to upload.
 * @returns A response containing `tree_json_id` and `policy_json_id`.
 */
export async function uploadFile(
  http: CoreStart["http"],
  notifications: CoreStart["notifications"],
  file: File
): Promise<{ tree_json_id: number; policy_json_id: number } | null> {

    const formData = new FormData();
    formData.append("file", file);

  try {
    const response = await http.post("http://localhost:5002/receive_xml", {
      body: formData,
      headers: {
        "Content-Type": undefined,
      },
    });

    if (
      !response ||
      typeof response !== "object" ||
      !response.tree_json_id ||
      !response.policy_json_id
    ) {
      throw new Error("Invalid response from server: missing required fields.");
    }

    return {
      tree_json_id: response.tree_json_id,
      policy_json_id: response.policy_json_id
    };
  } catch (error) {
    console.error("Error during file upload:", error);
    notifications.toasts.addDanger(
      `Error during file upload: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return null;
  }
}


/**
 * Loads the tree data and policy content from the database using their IDs.
 * @param http HTTP object from CoreStart.
 * @param notifications Notifications object from CoreStart.
 * @param treeId ID of the tree JSON in the database.
 * @param policyId ID of the policy JSON in the database.
 * @param refreshLists Optional functions to refresh policies and trees lists.
 */
export async function loadData(
  http: CoreStart["http"],
  notifications: CoreStart["notifications"],
  treeId: number,
  policyId: number,
  refreshLists?: {
    refreshPolicies: () => Promise<void>;
    refreshTrees: () => Promise<void>;
  }
): Promise<void> {
  try {
    const [treeResponse, policyResponse] = await Promise.all([
      // Fetch the tree data from the database
      http.get(`/api/adt_viewer/load_tree/${treeId}`),

      // Fetch the policy content from the database
      http.get(`/api/adt_viewer/load_policy/${policyId}`),
    ]);

    console.log("Loaded tree data:", treeResponse);
    console.log("Loaded policy content:", policyResponse);

    // Update the lists if refresh functions are provided
    if (refreshLists) {
      await Promise.all([
        refreshLists.refreshPolicies(),
        refreshLists.refreshTrees(),
      ]);
    }

    // Success notification
    notifications.toasts.addSuccess(
      `Data loaded successfully for Tree ID: ${treeId} and Policy ID: ${policyId}`
    );
  } catch (loadError) {
    console.error("Error during data load operations:", loadError);

    // Error notification
    notifications.toasts.addDanger(
      `Error during data loading: ${
        loadError instanceof Error ? loadError.message : "Unknown error"
      }`
    );
  }
}