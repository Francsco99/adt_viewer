import React, { useState } from "react";
import { EuiBasicTable, EuiSwitch, EuiSpacer, EuiBadge, EuiText } from "@elastic/eui";
import { useTreeContext } from "./tree_context";

interface NodeInfoProps {
  treeData: { nodes: { id: number; label: string; name: string; type: string; action?: string; role?: string }[] } | null; // Allow null for treeData
}

interface Node {
  id: number;
  label: string;
  name: string;
  type: string;
  action?: string;
  role?: string;
}

export const NodeInfo: React.FC<NodeInfoProps> = ({ treeData }) => {
  const { selectedNodesLabel } = useTreeContext(); // Get selected nodes (array of IDs) from context
  const [showAllNodes, setShowAllNodes] = useState(false); // Toggle to show all nodes
  const [pageIndex, setPageIndex] = useState(0); // Current page index
  const [pageSize, setPageSize] = useState(5); // Page size
  const [sortField, setSortField] = useState<keyof Node>("id"); // Sorting field
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc"); // Sorting direction

  // Fallback message when treeData is unavailable
    if (!treeData) {
      return (
        <div>
          <EuiText color="danger">
            <h3>Tree data not available</h3>
            <p>Please load the tree data to visualize the states.</p>
          </EuiText>
        </div>
      );
    }

  // Prepare table rows
  const rows: Node[] = showAllNodes
    ? treeData.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        name: node.name,
        type: node.type,
        action: node.action ?? "", // Default empty string if action is undefined
        role: node.role ?? "", // Default empty string if role is undefined
      }))
    : treeData.nodes
        .filter((node) => selectedNodesLabel.includes(node.label)) // Filter only selected nodes
        .map((node) => ({
          id: node.id,
          label: node.label,
          name: node.name,
          type: node.type,
          action: node.action ?? "",
          role: node.role ?? "",
        }));

  // Sort rows based on current sort field and direction
  const sortedRows = rows.sort((a, b) => {
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

  // Paginate rows based on current page
  const paginatedRows = sortedRows.slice(
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
      field: "name",
      name: "Name",
      sortable: true,
    },
    {
      field: "type",
      name: "Type",
      sortable: true,
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

  // Handle table page or sort change
  const onTableChange = ({
    page,
    sort,
  }: {
    page?: { index: number; size: number };
    sort?: { field: keyof Node; direction: "asc" | "desc" };
  }) => {
    if (page) {
      setPageIndex(page.index); // Update page index
      setPageSize(page.size); // Update page size
    }
    if (sort) {
      setSortField(sort.field); // Update sort field
      setSortDirection(sort.direction); // Update sort direction
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
        sorting={{
          sort: { field: sortField, direction: sortDirection },
        }} // Sorting configuration
        onChange={onTableChange} // Handle table change events
      />
    </div>
  );
};
