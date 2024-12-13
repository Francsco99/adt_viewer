import React, { useState, useEffect } from "react";
import {
  EuiBasicTable,
  EuiBadge,
  EuiButtonIcon,
  EuiSpacer,
  EuiToolTip,
  EuiPopover,
  EuiSwitch,
  EuiButton,
  EuiConfirmModal,
  EuiOverlayMask,
  EuiBasicTableColumn,
} from "@elastic/eui";
import { CoreStart } from "../../../../src/core/public";

interface Policy {
  state_id: number;
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
  state: string;
  agent: string;
  action: string;
  cost: number | string;
  time: number | string;
  nodes: number[];
}

interface PolicyEditorProps {
  states: Policy[];
  actions: Action[];
  editable: Boolean;
  http: CoreStart["http"];
  notifications: CoreStart["notifications"];
  selectedPolicy: string;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({
  selectedPolicy,
  states,
  actions,
  editable,
  http,
  notifications,
}) => {
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [originalTableData, setOriginalTableData] = useState<TableRow[]>([]);
  const [sortField, setSortField] = useState<keyof TableRow>("state");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [popoverOpen, setPopoverOpen] = useState<Record<number, boolean>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pageIndex, setPageIndex] = useState(0); // Pagination state
  const [pageSize, setPageSize] = useState(5); // Page size state

  useEffect(() => {
    const rows = states
      .map((policy, index) => {
        if (index === 0) return null; // Lo stato iniziale non ha transizione precedente
        const previousState = states[index - 1];
        const actionId = policy.actions_id[0];
        const actionDetails = actions.find((action) => action.id === actionId);

        return {
          state: `${previousState.state_id} -> ${policy.state_id}`,
          agent: actionDetails?.agent || "Unknown",
          action: actionDetails?.action || "Unknown",
          cost: actionDetails?.cost || "Unknown",
          time: actionDetails?.time || "Unknown",
          nodes: policy.action_nodes || [],
        };
      })
      .filter(Boolean) as TableRow[];
    setTableData(rows);
    setOriginalTableData(rows); // Salviamo i dati originali
    setIsEditMode(false);
  }, [states, actions]);

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

  const togglePopover = (rowIndex: number) => {
    setPopoverOpen((prev) => ({
      ...prev,
      [rowIndex]: !prev[rowIndex],
    }));
  };

  const closePopover = (rowIndex: number) => {
    setPopoverOpen((prev) => ({
      ...prev,
      [rowIndex]: false,
    }));
  };

  const handleDeleteRow = (rowIndex: number) => {
    const updatedTableData = [...tableData];
    updatedTableData.splice(rowIndex, 1); // Rimuovi la riga selezionata
    setTableData(updatedTableData);
  };

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

  const handleAddRow = () => {
    const newRow: TableRow = {
      state: `new -> new`,
      agent: "Unknown",
      action: "Unknown",
      cost: "Unknown",
      time: "Unknown",
      nodes: [],
    };

    setTableData((prevData) => [...prevData, newRow]);
  };

  const handleSaveChanges = async () => {
    try {
      const timestamp = Date.now();
      const originalFilename = selectedPolicy.split(".")[0] || "missing_name";
      const filename = `${originalFilename}_${timestamp}.json`;
      const formattedData = {
        editable: editable,
        states: states.map((state, index) => {
          const correspondingRow = tableData.find(
            (row) =>
              row.state ===
              `${states[index - 1]?.state_id} -> ${state.state_id}`
          );

          return {
            state_id: state.state_id,
            active_nodes: state.action_nodes, // Aggiorna i nodi attivi
            actions_id: state.actions_id,
            action_nodes: state.action_nodes,
          };
        }),
      };

      await http.post(`/api/adt_viewer/save_policy/${filename}`, {
        body: JSON.stringify(formattedData),
      });

      setOriginalTableData(tableData); // Aggiorna i dati originali
      notifications.toasts.addSuccess(`Policy saved successfully as: ${filename}`);
    } catch (error) {
      console.error("Error saving policy:", error);
      notifications.toasts.addDanger("An error occurred while saving the policy.");
    }
  };

  const handleToggleEditMode = () => {
    if (
      isEditMode &&
      JSON.stringify(tableData) !== JSON.stringify(originalTableData)
    ) {
      setShowConfirmationModal(true);
    } else {
      setIsEditMode(!isEditMode);
    }
  };

  const confirmSaveChanges = async () => {
    await handleSaveChanges();
    setShowConfirmationModal(false);
    setIsEditMode(false);
  };

  const abortChanges = () => {
    setTableData(originalTableData); // Ripristina i dati originali
    setShowConfirmationModal(false);
    setIsEditMode(false);
  };

  const paginatedItems = getSortedItems(tableData).slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const columns: Array<EuiBasicTableColumn<TableRow>> = [
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
      field: "nodes",
      name: "Nodes",
      render: (nodes: number[]) => (
        <EuiPopover
          button={
            <EuiButtonIcon
              iconType="arrowDown"
              aria-label="Show nodes"
              onClick={() => togglePopover(nodes[0])}
            />
          }
          isOpen={popoverOpen[nodes[0]] || false}
          closePopover={() => closePopover(nodes[0])}
        >
          <div style={{ padding: "8px" }}>
            {nodes.length > 0 ? (
              nodes.map((node, index) => <span key={index}>Node: {node}</span>)
            ) : (
              <span>No nodes</span>
            )}
          </div>
        </EuiPopover>
      ),
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
    ...(isEditMode
      ? [
          {
            name: "Manage",
            render: (_: any, row: TableRow, rowIndex: number) => (
              <div style={{ display: "flex", gap: "8px" }}>
                <EuiToolTip position="bottom" content={"Edit action"}>
                  <EuiButtonIcon
                    isDisabled={!isEditMode}
                    iconType="pencil"
                    color="primary"
                    aria-label="Edit Action"
                  />
                </EuiToolTip>
                <EuiToolTip position="bottom" content={"Delete action"}>
                  <EuiButtonIcon
                    isDisabled={!isEditMode}
                    iconType="trash"
                    color="danger"
                    aria-label="Delete Action"
                    onClick={() => handleDeleteRow(rowIndex)}
                  />
                </EuiToolTip>
              </div>
            ),
          } as EuiBasicTableColumn<TableRow>,
        ]
      : []),
  ];

  return (
    <div>
      <EuiSpacer size="m" />
      <EuiSwitch
        label="Enable Edit Mode"
        checked={isEditMode}
        onChange={handleToggleEditMode}
        disabled={!editable}
      />
      <EuiSpacer size="m" />
      {isEditMode && (
        <EuiButton color="secondary" onClick={handleAddRow}>
          Add Row
        </EuiButton>
      )}
      <EuiSpacer size="m" />
      <EuiBasicTable<TableRow>
        items={paginatedItems}
        columns={columns}
        tableLayout="auto"
        sorting={{ sort: { field: sortField, direction: sortDirection } }}
        pagination={{
          pageIndex,
          pageSize,
          totalItemCount: tableData.length,
          pageSizeOptions: [5, 10, 20], // Options for page size
        }}
        onChange={handleTableChange}
      />
      {isEditMode && (
        <EuiButton color="primary" onClick={handleSaveChanges}>
          Save Changes
        </EuiButton>
      )}

      {showConfirmationModal && (
        <EuiOverlayMask>
          <EuiConfirmModal
            title="Unsaved changes"
            onCancel={abortChanges}
            onConfirm={confirmSaveChanges}
            cancelButtonText="Abort Changes"
            confirmButtonText="Save Changes"
            buttonColor="danger"
            defaultFocusedButton="confirm"
          >
            <p>You have unsaved changes. Do you want to save or abort?</p>
          </EuiConfirmModal>
        </EuiOverlayMask>
      )}
    </div>
  );
};
