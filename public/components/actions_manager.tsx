import React, { useEffect, useState } from "react";
import {
  EuiBasicTable,
  EuiBadge,
  EuiSwitch,
  EuiSpacer,
  EuiText,
} from "@elastic/eui";
import { useTreeContext } from "./tree_context";

interface TreeState {
  state_id: number;
  active_nodes: number[];
  actions_id: number[];
  action_nodes: number[];
}

interface Action {
  id: number;
  agent: string;
  action: string;
  cost: number;
  time: number;
}

interface TableRow {
  agent: string;
  action: string;
  cost: number;
  time: number;
}

interface ActionsManagerProps {
  states: TreeState[];
  actions: Action[];
}

export const ActionsManager: React.FC<ActionsManagerProps> = ({
  states,
  actions,
}) => {
  const { selectedNode, selectedState } = useTreeContext();
  const [showAllActions, setShowAllActions] = useState(false);
  const [nodeActions, setNodeActions] = useState<Action[]>([]);
  const [stateTransitionActions, setStateTransitionActions] = useState<
    Action[]
  >([]);
  const [nextState, setNextState] = useState<number | null>(null);

  // Stato per paginazione
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  // Stato per sorting
  const [sortField, setSortField] = useState<keyof TableRow>("agent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (selectedNode) {
      const nodeId = selectedNode.data.id;
      const relevantActionIds = states.flatMap((state) =>
        state.action_nodes.includes(nodeId) ? state.actions_id : []
      );
      const actionsForNode = actions.filter((action) =>
        relevantActionIds.includes(action.id)
      );
      setNodeActions(actionsForNode);
    } else {
      setNodeActions([]);
    }
  }, [selectedNode, states, actions]);

  useEffect(() => {
    if (selectedState !== undefined) {
      const currentState = states.find(
        (state) => state.state_id === selectedState
      );
      const nextStateObj = states.find(
        (state) => state.state_id === selectedState + 1
      );

      if (currentState && nextStateObj) {
        setNextState(nextStateObj.state_id);
        const transitionActionIds = nextStateObj.actions_id;
        const actionsForTransition = actions.filter((action) =>
          transitionActionIds.includes(action.id)
        );
        setStateTransitionActions(actionsForTransition);
      } else {
        setNextState(null);
        setStateTransitionActions([]);
      }
    } else {
      setNextState(null);
      setStateTransitionActions([]);
    }
  }, [selectedState, states, actions]);

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
  ];

  const handleTableChange = ({
    page,
    sort,
  }: {
    page?: { index: number; size: number };
    sort?: { field: keyof TableRow; direction: "asc" | "desc" };
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

  const visibleNodeActions = getSortedItems(
    showAllActions
      ? actions.map((action) => ({
          agent: action.agent,
          action: action.action,
          cost: action.cost,
          time: action.time,
        }))
      : nodeActions.map((action) => ({
          agent: action.agent,
          action: action.action,
          cost: action.cost,
          time: action.time,
        }))
  ).slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

  const visibleStateTransitionActions = getSortedItems(
    stateTransitionActions.map((action) => ({
      agent: action.agent,
      action: action.action,
      cost: action.cost,
      time: action.time,
    }))
  );

  const paginationNodeActions = showAllActions
    ? {
        pageIndex,
        pageSize,
        totalItemCount: actions.length,
        pageSizeOptions: [5, 10, 20],
      }
    : undefined;

  return (
    <div>
      <EuiSpacer size="m" />
      <EuiSwitch
        label="Show all actions"
        checked={showAllActions}
        onChange={(e) => {
          setShowAllActions(e.target.checked);
          setPageIndex(0); // Reset della pagina
        }}
      />
      <EuiSpacer size="m" />
      {/* Tabella delle azioni disponibili per il nodo selezionato */}
      <EuiText>
        <h5>
          {selectedNode
            ? `Actions available for Node ${selectedNode.data.id}`
            : "No Node Selected"}
        </h5>
      </EuiText>

      <EuiBasicTable<TableRow>
        items={visibleNodeActions}
        columns={columns}
        tableLayout="auto"
        sorting={{ sort: { field: sortField, direction: sortDirection } }}
        onChange={handleTableChange}
        pagination={paginationNodeActions}
      />
      <EuiSpacer size="l" />
      {/* Tabella delle azioni di transizione */}
      <EuiText>
        <h5>
          State {selectedState}{" "}
          {nextState !== null ? `-> State ${nextState}` : ""}
        </h5>
      </EuiText>
      <EuiBasicTable<TableRow>
        items={visibleStateTransitionActions}
        columns={columns}
        tableLayout="auto"
        sorting={{ sort: { field: sortField, direction: sortDirection } }}
        onChange={handleTableChange}
      />
    </div>
  );
};
