import { CoreStart } from "../../../../src/core/public";

interface ExportResponse {
  file_name: string;
  tree_data: object;
  policy_content: object;
}

export async function exportData(
  http: CoreStart["http"],
  notifications: CoreStart["notifications"],
  payload: object | string, // Può essere un JSON o un XML
  isXml: boolean = false // Indica se il payload è XML
): Promise<ExportResponse | null> {
  try {
    const headers = {
      "Content-Type": isXml ? "application/xml" : "application/json",
    };

    const response = await http.post("http://localhost:5002/receive_json", {
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      headers,
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

export async function saveData(
  http: CoreStart["http"],
  notifications: CoreStart["notifications"],
  fileName: string,
  treeData: object,
  policyContent: object
): Promise<void> {
  try {
    const [savePolicyResponse, saveTreeResponse] = await Promise.all([
      http.post(`/api/adt_viewer/save_policy/${fileName}`, {
        body: JSON.stringify(policyContent),
        headers: { "Content-Type": "application/json" },
      }),
      http.post(`/api/adt_viewer/save_tree/${fileName}`, {
        body: JSON.stringify(treeData),
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    console.log("Policy content saved:", savePolicyResponse);
    console.log("Tree data saved:", saveTreeResponse);

    notifications.toasts.addSuccess(
      `File saved successfully as ${fileName} in server/data/trees and policies`
    );
  } catch (saveError) {
    console.error("Error during save operations:", saveError);
    notifications.toasts.addDanger(
      `Error during save operations: ${
        saveError instanceof Error ? saveError.message : "Unknown error"
      }`
    );
  }
}
