import React, { useState, useEffect } from "react";
import {
  EuiBasicTable,
  EuiBadge,
  EuiSpacer,
  EuiIcon,
  EuiToolTip,
  EuiSwitch,
  EuiButton,
} from "@elastic/eui";
import { CoreStart } from "../../../../src/core/public";
import { useTreeContext } from "./tree_context";

interface TreeNode {
  id: number;
  label: string;
  type: string;
  action?: string;
  cost?: number;
  time?: number;
  role?: string;
  hidden?: boolean;
}

interface TreeData {
  nodes: TreeNode[];
  edges: { id_source: number; id_target: number }[];
}

interface ActionsManagerProps {
  treeData: TreeData | null;
  http: CoreStart["http"];
  notifications: CoreStart["notifications"];
}

export const ActionsManager: React.FC<ActionsManagerProps> = ({
  treeData,
  http,
  notifications,
}) => {
  const { selectedNodesLabel, setSelectedNodesLabel, selectedTree } =
    useTreeContext();

  const [flaggedActions, setFlaggedActions] = useState<string[]>([]);
  const [showAllActions, setShowAllActions] = useState(false);

  useEffect(() => {
    const hiddenLabels = treeData?.nodes
      .filter((node) => node.type === "Action" && node.hidden)
      .map((node) => node.label) || [];
    setFlaggedActions(hiddenLabels);
  }, [treeData]);

  if (!treeData) {
    return <p>Loading tree data...</p>;
  }

  const actionNodes = Array.from(
    new Map(
      treeData.nodes
        .filter((node) => node.type === "Action")
        .map((node) => [node.label, node])
    ).values()
  );

  const toggleFlag = (actionLabel: string) => {
    setFlaggedActions((prev) =>
      prev.includes(actionLabel)
        ? prev.filter((label) => label !== actionLabel)
        : [...prev, actionLabel]
    );
  };

  const toggleNodeSelection = (label: string) => {
    setSelectedNodesLabel([
      ...selectedNodesLabel.filter((selectedLabel) => selectedLabel !== label),
      ...(selectedNodesLabel.includes(label) ? [] : [label]),
    ]);
  };

  const handleExport = async () => {
    try {
      const updatedTreeData = {
        original_name: selectedTree,
        tree: {
          nodes: treeData.nodes.map((node) => {
            if (node.type === "Action" && flaggedActions.includes(node.label)) {
              return { ...node, hidden: true };
            }
            return { ...node, hidden: false };
          }),
          edges: treeData.edges,
        },
      };

      const response = await http.post("http://localhost:5002/receive_json", {
        body: JSON.stringify(updatedTreeData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response || typeof response !== "object" || !response.file_name) {
        throw new Error("Invalid response from server: missing file_name");
      }

      const { file_name, tree_data, policy_content } = response;

      try {
        const [savePolicyResponse, saveTreeResponse] = await Promise.all([
          http.post(`/api/adt_viewer/save_policy/${file_name}`, {
            body: JSON.stringify(policy_content),
            headers: {
              "Content-Type": "application/json",
            },
          }),
          http.post(`/api/adt_viewer/save_tree/${file_name}`, {
            body: JSON.stringify(tree_data),
            headers: {
              "Content-Type": "application/json",
            },
          }),
        ]);

        console.log("Policy content saved:", savePolicyResponse);
        console.log("Tree data saved:", saveTreeResponse);

        notifications.toasts.addSuccess(
          `File saved successfully as ${file_name} in server/data/trees and policies`
        );
      } catch (saveError) {
        console.error("Error during save operations:", saveError);
        notifications.toasts.addDanger(
          `Error during save operations: ${
            saveError instanceof Error ? saveError.message : "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error during export operation:", error);
      notifications.toasts.addDanger(
        `Error during export operation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const columns = [
    {
      field: "role",
      name: "Role",
      render: (role: string) => (
        <EuiBadge color={role === "Defender" ? "success" : "danger"}>
          {role?.charAt(0).toUpperCase() + role?.slice(1)}
        </EuiBadge>
      ),
      sortable: true,
    },
    {
      field: "label",
      name: "Action",
      sortable: true,
      render: (label: string) => (
        <span
          style={{
            fontWeight: selectedNodesLabel.includes(label) ? "bold" : "normal",
          }}
        >
          {label}
        </span>
      ),
    },
    {
      field: "cost",
      name: "Monetary Cost",
      sortable: true,
    },
    {
      field: "time",
      name: "Time",
      sortable: true,
    },
    {
      field: "flag",
      name: "Flag",
      render: (_: any, item: TreeNode) => (
        <EuiToolTip
          position="top"
          content={
            flaggedActions.includes(item.label)
              ? "Unflag this action"
              : "Flag this action"
          }
        >
          <EuiIcon
            type="flag"
            color={flaggedActions.includes(item.label) ? "danger" : "subdued"}
            onClick={(e) => {
              e.stopPropagation();
              toggleFlag(item.label);
            }}
            style={{ cursor: "pointer" }}
            aria-label={`Flag action ${item.label}`}
          />
        </EuiToolTip>
      ),
    },
  ];

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(3);
  const [sortField, setSortField] = useState<keyof TreeNode>("label");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleTableChange = ({
    page,
    sort,
  }: {
    page?: { index: number; size: number };
    sort?: { field: keyof TreeNode; direction: "asc" | "desc" };
  }) => {
    if (sort) {
      setSortField(sort.field);
      setSortDirection(sort.direction);
    }
    if (page) {
      setPageIndex(page.index);
      setPageSize(page.size);
    }
  };

  const getSortedItems = (items: TreeNode[]) => {
    const sortedItems = [...items].sort((a, b) => {
      const first = a[sortField];
      const second = b[sortField];
      if (typeof first === "string" && typeof second === "string") {
        return sortDirection === "asc"
          ? first.localeCompare(second)
          : second.localeCompare(first);
      }
      if (typeof first === "number" && typeof second === "number") {
        return sortDirection === "asc" ? first - second : second - first;
      }
      return 0;
    });

    return sortedItems;
  };

  const displayedActions = showAllActions
    ? actionNodes
    : actionNodes.filter((node) => node.role === "Defender");

  const paginatedActions = getSortedItems(displayedActions).slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  return (
    <div>
      <EuiSwitch
        label={
          showAllActions
            ? "Show only defender actions"
            : "Show all available actions"
        }
        checked={showAllActions}
        onChange={(e) => setShowAllActions(e.target.checked)}
      />
      <EuiSpacer size="m" />
      <EuiBasicTable
        items={paginatedActions}
        columns={columns}
        rowProps={(item) => {
          const isFlagged = flaggedActions.includes(item.label);
        
          return {
            onClick: () => toggleNodeSelection(item.label), // Gestisce la selezione
            style: {
              backgroundColor: isFlagged ? "rgba(255, 0, 0, 0.1)" : undefined, // Colore rosso se flaggato
              cursor: "pointer", // Cambia il cursore per indicare che è cliccabile
            },
          };
        }}             
        pagination={{
          pageIndex,
          pageSize,
          totalItemCount: displayedActions.length,
          pageSizeOptions: [3, 10, 20],
        }}
        sorting={{ sort: { field: sortField, direction: sortDirection } }}
        onChange={handleTableChange}
      />
      <EuiSpacer size="m" />
      <EuiButton onClick={handleExport}>Export configuration</EuiButton>
    </div>
  );
};
