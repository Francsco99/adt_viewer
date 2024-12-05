import React, { useState, useEffect } from "react";
import {
  EuiBasicTable,
  EuiBadge,
  EuiButtonIcon,
  EuiSpacer,
} from "@elastic/eui";

interface Policy {
  state_id: number;
  actions_id: number[];
}

interface Action {
  id: number;
  agent: string;
  action: string;
  cost: number;
  time: number;
}

interface TableRow {
  state: string;
  agent: string;
  action: string;
  cost: number | string;
  time: number | string;
}

interface PolicyEditorProps {
  policies: Policy[];
  actions: Action[];
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({ policies, actions }) => {
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [sortField, setSortField] = useState<keyof TableRow>("state");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const rows = policies
      .map((policy, index) => {
        if (index === 0) return null; // Lo stato iniziale non ha transizione precedente
        const previousState = policies[index - 1];
        const actionId = policy.actions_id[0];
        const actionDetails = actions.find((action) => action.id === actionId);

        return {
          state: `${previousState.state_id} -> ${policy.state_id}`,
          agent: actionDetails?.agent || "Unknown",
          action: actionDetails?.action || "Unknown",
          cost: actionDetails?.cost || "Unknown",
          time: actionDetails?.time || "Unknown",
        };
      })
      .filter(Boolean) as TableRow[];
    setTableData(rows);
  }, [policies, actions]);

  const getSortedItems = (items: TableRow[]) => {
    return [...items].sort((a, b) => {
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
  };

  const columns = [
    {
      field: "state",
      name: "State",
      sortable: true,
    },
    {
      field: "agent",
      name: "Agent",
      render: (agent: string) => (
        <EuiBadge color={agent === "defender" ? "success" : "danger"}>
          {agent.charAt(0).toUpperCase() + agent.slice(1)}
        </EuiBadge>
      ),
      sortable: true,
    },
    {
      field: "action",
      name: "Action",
    },
    {
      field: "cost",
      name: "Cost",
      sortable: true,
    },
    {
      field: "time",
      name: "Time",
      sortable: true,
    },
    {
      name: "Manage",
      render: () => (
        <div style={{ display: "flex", gap: "8px" }}>
          <EuiButtonIcon iconType="pencil" aria-label="Edit Action" />
          <EuiButtonIcon iconType="trash" aria-label="Delete Action" />
        </div>
      ),
    },
  ];

  const handleTableChange = ({
    sort,
  }: {
    sort?: { field: keyof TableRow; direction: "asc" | "desc" };
  }) => {
    if (sort) {
      setSortField(sort.field);
      setSortDirection(sort.direction);
    }
  };

  const sortedItems = getSortedItems(tableData);

  return (
    <div>
      <EuiSpacer size="m" />
      <EuiBasicTable<TableRow>
        items={sortedItems}
        columns={columns}
        tableLayout="auto"
        sorting={{ sort: { field: sortField, direction: sortDirection } }}
        onChange={handleTableChange}
      />
    </div>
  );
};
