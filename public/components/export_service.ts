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
 * @returns A response containing `file_name`, `tree_data`, and `policy_content`.
 */
export async function uploadFile(
  http: CoreStart["http"],
  notifications: CoreStart["notifications"],
  file: File
): Promise<ExportResponse | null> {

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
      !response.file_name ||
      !response.tree_data ||
      !response.policy_content
    ) {
      throw new Error("Invalid response from server: missing required fields.");
    }

    return response;
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
 * Saves the data returned from the server (tree_data and policy_content) and updates the lists.
 * @param http HTTP object from CoreStart.
 * @param notifications Notifications object from CoreStart.
 * @param fileName Name of the saved file.
 * @param treeData Tree data returned by the server.
 * @param policyContent Policy content returned by the server.
 * @param refreshLists Optional functions to refresh policies and trees lists.
 */
export async function saveData(
  http: CoreStart["http"],
  notifications: CoreStart["notifications"],
  fileName: string,
  treeData: object,
  policyContent: object,
  refreshLists?: {
    refreshPolicies: () => Promise<void>;
    refreshTrees: () => Promise<void>;
  }
): Promise<void> {
  try {
    const [savePolicyResponse, saveTreeResponse] = await Promise.all([
      // Save the policy content
      http.post(`/api/adt_viewer/save_policy/${fileName}`, {
        body: JSON.stringify(policyContent),
        headers: { "Content-Type": "application/json" },
      }),

      // Save the tree data
      http.post(`/api/adt_viewer/save_tree/${fileName}`, {
        body: JSON.stringify(treeData),
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    console.log("Policy content saved:", savePolicyResponse);
    console.log("Tree data saved:", saveTreeResponse);

    // Update the lists if refresh functions are provided
    if (refreshLists) {
      await Promise.all([
        refreshLists.refreshPolicies(),
        refreshLists.refreshTrees(),
      ]);
    }

    // Success notification
    notifications.toasts.addSuccess(
      `File saved successfully as ${fileName} in server/data/trees and policies`
    );
  } catch (saveError) {
    console.error("Error during save operations:", saveError);

    // Error notification
    notifications.toasts.addDanger(
      `Error during save operations: ${
        saveError instanceof Error ? saveError.message : "Unknown error"
      }`
    );
  }
}
