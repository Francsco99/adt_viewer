import React, { useState } from "react";
import {
  EuiBasicTable,
  EuiBadge,
  EuiSpacer,
  EuiText,
  EuiIcon,
  EuiToolTip,
  EuiSwitch,
} from "@elastic/eui";

interface Action {
  id: number;
  agent: string;
  action: string;
  cost: number;
  time: number;
}

interface State {
  state_id: number;
  active_nodes: number[];
  actions_id: number[];
  action_nodes: number[];
}

interface ActionTableProps {
  actions: Action[];
  states: State[];
}

export const ActionTable: React.FC<ActionTableProps> = ({ actions, states }) => {
  const [flaggedActions, setFlaggedActions] = useState<number[]>([]);
  const [showAllActions, setShowAllActions] = useState(false); // Controlla se mostrare tutte le azioni

  // Otteniamo un set di tutti gli ID delle azioni attive nella policy corrente
  const activeActionIds = new Set(
    states.flatMap((state) => state.actions_id)
  );

  // Azioni attive
  const activeActions = actions.filter((action) =>
    activeActionIds.has(action.id)
  );

  const toggleFlag = (actionId: number) => {
    setFlaggedActions((prev) =>
      prev.includes(actionId)
        ? prev.filter((id) => id !== actionId)
        : [...prev, actionId]
    );
  };

  const columns = [
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
      name: "Manage",
      render: (_: any, item: Action) => (
        <EuiToolTip
          position="top"
          content={
            flaggedActions.includes(item.id)
              ? "Unflag this action"
              : "Flag this action"
          }
        >
          <EuiIcon
            type="flag"
            color={flaggedActions.includes(item.id) ? "danger" : "subdued"}
            onClick={() => toggleFlag(item.id)}
            style={{ cursor: "pointer" }}
            aria-label={`Flag action ${item.id}`}
          />
        </EuiToolTip>
      ),
    },
  ];

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState<keyof Action>("agent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleTableChange = ({
    page,
    sort,
  }: {
    page?: { index: number; size: number };
    sort?: { field: keyof Action; direction: "asc" | "desc" };
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

  const getSortedItems = (items: Action[]) => {
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

  // Mostra solo le azioni attive o tutte le azioni, a seconda dello stato `showAllActions`
  const displayedActions = showAllActions ? actions : activeActions;

  const paginatedActions = getSortedItems(displayedActions).slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  return (
    <div>
      <EuiSwitch
        label={showAllActions ? "Show only active actions" : "Show all actions"}
        checked={showAllActions}
        onChange={(e) => setShowAllActions(e.target.checked)}
      />
      <EuiSpacer size="m" />
      <EuiBasicTable
        items={paginatedActions}
        columns={columns}
        rowProps={(item) => {
          // Evidenziazione righe
          if (flaggedActions.includes(item.id)) {
            return { style: { backgroundColor: "rgba(255, 0, 0, 0.1)" } };
          }
          if (activeActionIds.has(item.id)) {
            return { style: { backgroundColor: "rgba(0, 128, 0, 0.1)" } };
          }
          return {};
        }}
        pagination={{
          pageIndex,
          pageSize,
          totalItemCount: displayedActions.length,
          pageSizeOptions: [5, 10, 20],
        }}
        sorting={{ sort: { field: sortField, direction: sortDirection } }}
        onChange={handleTableChange}
      />
      <EuiSpacer size="m" />
      <EuiText>
        <h4>Flagged Actions</h4>
        {flaggedActions.length > 0 ? (
          <p>{flaggedActions.join(", ")}</p>
        ) : (
          <p>No actions flagged.</p>
        )}
      </EuiText>
    </div>
  );
};
