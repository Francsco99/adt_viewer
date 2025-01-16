import React, { useState } from "react";
import { EuiBasicTable, EuiSwitch, EuiSpacer, EuiBadge } from "@elastic/eui";
import { useTreeContext } from "./tree_context";

interface NodeInfoProps {
  treeData: { nodes: { id: number; label: string; type: string; action?: string; role?: string }[] } | null; // Allow null for treeData
}

interface Node {
  id: number;
  label: string;
  type: string;
  action?: string;
  role?: string;
}

export const NodeInfo: React.FC<NodeInfoProps> = ({ treeData }) => {
  const { selectedNodes } = useTreeContext(); // Get selected nodes (array of IDs) from context
  const [showAllNodes, setShowAllNodes] = useState(false); // Toggle to show all nodes
  const [pageIndex, setPageIndex] = useState(0); // Current page index
  const [pageSize, setPageSize] = useState(5); // Page size

  // Show loading message if treeData is not available
  if (!treeData) {
    return <p>Loading tree data...</p>;
  }

  // Prepare table rows
  const rows: Node[] = showAllNodes
    ? treeData.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        type: node.type,
        action: node.action ?? "", // Default empty string if action is undefined
        role: node.role ?? "", // Default empty string if role is undefined
      }))
    : treeData.nodes
        .filter((node) => selectedNodes.includes(node.id)) // Filter only selected nodes
        .map((node) => ({
          id: node.id,
          label: node.label,
          type: node.type,
          action: node.action ?? "",
          role: node.role ?? "",
        }));

  // Paginate rows based on current page
  const paginatedRows = rows.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  // Define table columns
  const columns = [
    {
      field: "id",
      name: "ID",
      sortable: true,
    },
    {
      field: "label",
      name: "Label",
    },
    {
      field: "type",
      name: "Type",
    },
    {
      field: "action",
      name: "Action",
      render: (action: string) => (action ? action : "N/A"), // Render "N/A" for empty actions
    },
    {
      field: "role",
      name: "Role",
      render: (role: string) =>
        role ? (
          <EuiBadge color={role === "Attacker" ? "danger" : "success"}>
            {role}
          </EuiBadge>
        ) : (
          "N/A"
        ), // Render badge or "N/A"
    },
  ];

  // Configure pagination
  const pagination = {
    pageIndex,
    pageSize,
    totalItemCount: rows.length,
    pageSizeOptions: [5, 10, 20], // Available page sizes
  };

  // Handle table page change
  const onTableChange = ({
    page,
  }: {
    page: { index: number; size: number };
  }) => {
    if (page) {
      setPageIndex(page.index); // Update page index
      setPageSize(page.size); // Update page size
    }
  };

  return (
    <div>
      {/* Toggle to show all nodes or selected nodes */}
      <EuiSwitch
        label="Show all nodes"
        checked={showAllNodes}
        onChange={(e) => {
          setShowAllNodes(e.target.checked);
          setPageIndex(0); // Reset to first page
        }}
      />
      <EuiSpacer size="m" />
      {/* Render the table */}
      <EuiBasicTable<Node>
        items={paginatedRows} // Rows for the current page
        columns={columns}
        tableLayout="auto"
        pagination={pagination} // Pagination configuration
        onChange={onTableChange} // Handle table change events
      />
    </div>
  );
};
