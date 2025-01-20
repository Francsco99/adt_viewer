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
  treeData: TreeData | null; // Tree data containing nodes and edges
  http: CoreStart["http"];
  notifications: CoreStart["notifications"];
}

export const ActionsManager: React.FC<ActionsManagerProps> = ({
  treeData,
  http,
  notifications,
}) => {
  if (!treeData) {
    return <p>Loading tree data...</p>;
  }

  const [flaggedActions, setFlaggedActions] = useState<string[]>([]);
  const [showAllActions, setShowAllActions] = useState(false);
  const { selectedTree } = useTreeContext();

  // Inizializza flaggedActions in base ai nodi con hidden=true
  useEffect(() => {
    const hiddenLabels = treeData.nodes
      .filter((node) => node.type === "Action" && node.hidden)
      .map((node) => node.label);
    setFlaggedActions(hiddenLabels);
  }, [treeData]);

  // Filtra i nodi di tipo "Action" dal treeData e rimuovi duplicati
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

  const handleExport = async () => {
    try {
      // Creazione della struttura JSON con tutti i nodi e gli edge originali
      const updatedTreeData = {
        original_name: selectedTree,
        tree: {
          nodes: treeData.nodes.map((node) => {
            // Verifica se il nodo è flaggato (usando la label)
            if (node.type === "Action" && flaggedActions.includes(node.label)) {
              return { ...node, hidden: true }; // Aggiunge l'attributo "hidden: true"
            }
            return { ...node, hidden: false }; // Rimuove hidden se non è flaggato
          }),
          edges: treeData.edges,
        },
      };

      // Invia il JSON al server Python
      const response = await http.post("http://localhost:5002/receive_json", {
        body: JSON.stringify(updatedTreeData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response || typeof response !== "object" || !response.file_name) {
        throw new Error("Invalid response from server: missing file_name");
      }

      const { file_name, data } = response;

      // Salva il file con il nome restituito dal server
      await http.post(`/api/adt_viewer/save_tree/${file_name}`, {
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Notifica di successo
      notifications.toasts.addSuccess(
        `File saved successfully as ${file_name} in server/data/trees`
      );
    } catch (error) {
      console.error("Error saving updated tree data file:", error);
      notifications.toasts.addDanger(
        `Error saving updated tree data file: ${
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
            onClick={() => toggleFlag(item.label)}
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
          if (flaggedActions.includes(item.label)) {
            return { style: { backgroundColor: "rgba(255, 0, 0, 0.1)" } };
          }
          return {};
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
