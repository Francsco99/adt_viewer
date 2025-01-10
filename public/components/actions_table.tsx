import React, { useState } from "react";
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
  http: CoreStart["http"];
  notifications: CoreStart["notifications"];
}

export const ActionTable: React.FC<ActionTableProps> = ({
  actions,
  states,
  http,
  notifications,
}) => {
  const [flaggedActions, setFlaggedActions] = useState<number[]>([]);
  const [showAllActions, setShowAllActions] = useState(false);

  // Otteniamo un set di tutti gli ID delle azioni attive nella policy corrente
  const activeActionIds = new Set(states.flatMap((state) => state.actions_id));

  const toggleFlag = (actionId: number) => {
    setFlaggedActions((prev) =>
      prev.includes(actionId)
        ? prev.filter((id) => id !== actionId)
        : [...prev, actionId]
    );
  };   

  const handleExport = async () => {
    try {
      // Filtra le azioni prima di inviarle
      const filteredActions = actions.filter(
        (action) => !flaggedActions.includes(action.id)
      );
  
      // Invia il JSON al server Python
      const updatedData = await http.post("http://localhost:5001/receive_json", {
        body: JSON.stringify({ actions: filteredActions }),
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      // Controlla se i dati restituiti sono validi
      if (!updatedData || typeof updatedData !== "object") {
        throw new Error("Invalid JSON response from Python server");
      }
  
      // Salva il file aggiornato usando l'API del plugin
      await http.post("/api/adt_viewer/save_actions/updated_actions.json", {
        body: JSON.stringify(updatedData),
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      // Notifica di successo
      notifications.toasts.addSuccess(
        "Updated actions file saved successfully in server/data/actions"
      );
    } catch (error) {
      // Log dell'errore
      console.error("Error saving updated actions file:", error);
  
      // Notifica di errore
      notifications.toasts.addDanger(
        `Error saving updated actions file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
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

  const displayedActions = showAllActions
    ? actions
    : actions.filter((action) => activeActionIds.has(action.id));

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
      <EuiButton onClick={handleExport}>Save Filtered Actions</EuiButton>
    </div>
  );
};
