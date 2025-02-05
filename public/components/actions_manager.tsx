import React, { useState, useEffect } from "react";
import {
  EuiBasicTable,
  EuiBadge,
  EuiSpacer,
  EuiIcon,
  EuiToolTip,
  EuiSwitch,
  EuiButton,
  EuiLoadingSpinner,
  EuiFieldText,
} from "@elastic/eui";
import { CoreStart } from "../../../../src/core/public";
import { useTreeContext } from "./tree_context";
import { FallbackMessage } from "./fallback_messages";
import { exportData, loadData } from "./export_service";

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
  refreshPoliciesList: () => void;
  refreshTreesList: () => void;
}

export const ActionsManager: React.FC<ActionsManagerProps> = ({
  treeData,
  http,
  notifications,
  refreshPoliciesList,
  refreshTreesList,
}) => {
  const { selectedNodesLabel, setSelectedNodesLabel, selectedTree } =
    useTreeContext();

  const [flaggedActions, setFlaggedActions] = useState<string[]>([]);
  const [showAllActions, setShowAllActions] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // Uploading state
  const [fileName, setFileName] = useState(""); // Custom fileName for export
  

  useEffect(() => {
    const hiddenLabels = treeData?.nodes
      .filter((node) => node.type === "Action" && node.hidden)
      .map((node) => node.label) || [];
    setFlaggedActions(hiddenLabels);
  }, [treeData]);

  // Fallback message when treeData is unavailable
    if (!treeData) {
      return (
        <FallbackMessage 
          title="Tree data not available"
          message="Please load the tree data to visualize the states."
        />
      );
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
    // Generate default name if fileName field is empty
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
    const generatedFileName = fileName.trim() !== "" ? fileName : `export_${timestamp}`;

    const updatedTreeData = {
      file_name: generatedFileName,
      tree_id: selectedTree?.id,
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

    setIsUploading(true); // Mostra lo spinner
  
    const response = await exportData(http, notifications, updatedTreeData);
    
    if (response) {
        const { tree_json_id, policy_json_id } = response;
        console.log(response);
        await loadData(http, notifications, tree_json_id, policy_json_id, {
          refreshPolicies: async () => refreshPoliciesList(),
          refreshTrees: async () => refreshTreesList(),
        });
      }
    setIsUploading(false); // Nascondi lo spinner
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
  const [pageSize, setPageSize] = useState(4);
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
  ? actionNodes.filter((node) => node.role === "Defender") // Mostra solo Defender
  : actionNodes; // Mostra tutte le azioni


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
          pageSizeOptions: [4, 10, 20],
        }}
        sorting={{ sort: { field: sortField, direction: sortDirection } }}
        onChange={handleTableChange}
      />
      <EuiSpacer size="m" />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <EuiButton onClick={handleExport}>Export configuration</EuiButton>
        <EuiFieldText
          placeholder="Enter file name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}/>
        {isUploading && <EuiLoadingSpinner size="l" />}
      </div>
    </div>
  );
};
