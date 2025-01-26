import React, { useEffect } from "react";
import {
  EuiPanel,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiBadge,
  EuiToolTip,
  EuiSpacer,
  EuiTable,
  EuiTableBody,
  EuiTableRow,
  EuiTableRowCell,
  EuiTableHeaderCell,
} from "@elastic/eui";
import { useTreeContext } from "./tree_context";

interface StatesVisualizerProps {
  states: {
    optimal_action: string | null; // The optimal action for the state
    state_data: Record<string, number | boolean>; // State attributes and their values
    state_id: number; // Unique identifier for the state
  }[];
  treeData: {
    nodes: {
      id: number; // Node ID
      label: string; // Node label
      name: string; // Node name
      action?: string; // Action associated with the node
      cost?: number; // Cost of the action
      time?: number; // Time required for the action
      role?: string; // Role associated with the node (e.g., Attacker, Defender)
    }[];
    edges: { id_source: number; id_target: number }[]; // Connections between nodes
  } | null;
}

export const StatesVisualizer: React.FC<StatesVisualizerProps> = ({
  states,
  treeData,
}) => {
  const {
    selectedStateID,
    setSelectedStateID,
    setActiveNodes,
    selectedNodeColor,
    selectedNodesLabel,
    setSelectedNodesLabel,
  } = useTreeContext();

  // Toggles selection of a node based on its label
  const handleElementClick = (label: string) => {
    const updatedLabels = selectedNodesLabel.includes(label)
      ? selectedNodesLabel.filter((l) => l !== label)
      : [...selectedNodesLabel, label];
    setSelectedNodesLabel(updatedLabels);
  };

  // Extracts active nodes from state_data
  const extractActiveNodes = (stateData: Record<string, number | boolean>) => {
    if (!stateData) {
      return [];
    }
    return Object.entries(stateData).map(([key, value]) => ({
      label: key,
      active: typeof value === "boolean" ? (value ? 1 : 0) : value,
    }));
  };

  // Updates activeNodes whenever the selected state changes
  useEffect(() => {
    if (selectedStateID >= 0 && states[selectedStateID]) {
      const activeNodesMap = extractActiveNodes(
        states[selectedStateID].state_data
      );
      setActiveNodes(activeNodesMap);
    }
  }, [selectedStateID, states, setActiveNodes]);

  // Calculates cumulative costs for a given state index
  const calculateCumulativeCosts = (stateIndex: number) => {
    let totalTimeAttacker = 0;
    let totalCostAttacker = 0;
    let totalTimeDefender = 0;
    let totalCostDefender = 0;

    for (let i = 1; i <= stateIndex; i++) {
      const actionLabel = states[i].optimal_action;
      if (actionLabel) {
        const actionDetails = treeData?.nodes.find(
          (node) => node.action === actionLabel
        );
        if (actionDetails) {
          if (actionDetails.role === "Attacker") {
            totalTimeAttacker += actionDetails.time || 0;
            totalCostAttacker += actionDetails.cost || 0;
          } else if (actionDetails.role === "Defender") {
            totalTimeDefender += actionDetails.time || 0;
            totalCostDefender += actionDetails.cost || 0;
          }
        }
      }
    }

    const wt = 1; // Weight for time
    const wc = 1; // Weight for cost
    return {
      attackerObjective: wt * totalTimeAttacker + wc * totalCostAttacker,
      defenderObjective: wt * totalTimeDefender + wc * totalCostDefender,
    };
  };

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

  // Fallback message when states is unavailable
  if (!states || states.length === 0) {
    return (
      <div>
        <EuiText color="danger">
          <h3>States data not available</h3>
          <p>Please load the states data to visualize the tree states.</p>
        </EuiText>
      </div>
    );
  }
  
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {states.map((state, index) => {
        const activeNodesMap = extractActiveNodes(state.state_data);
        const cumulativeCosts = calculateCumulativeCosts(index);

        return (
          <React.Fragment key={state.state_id}>
            {/* Transition between states */}
            {index > 0 && (
              <EuiFlexGroup
                alignItems="center"
                gutterSize="m"
                direction="row"
                style={{ marginBottom: "8px" }}
              >
                <EuiFlexItem grow={false}>
                  <EuiIcon type="sortDown" size="l" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiToolTip
                    position="top"
                    content={`Optimal Action: ${state.optimal_action}`}
                  >
                    <EuiBadge
                      color={
                        treeData.nodes.find(
                          (node) => node.label === state.optimal_action
                        )?.role === "Attacker"
                          ? "danger"
                          : "success"
                      }
                      style={{
                        cursor: "pointer",
                        marginRight: "8px",
                      }}
                    >
                      {state.optimal_action || "Unknown Action"}
                    </EuiBadge>
                  </EuiToolTip>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}

            {/* Current state */}
            <EuiFlexGroup alignItems="center" gutterSize="m">
              <EuiFlexItem grow={false}>
                <EuiToolTip
                  position="left"
                  content={`State ID: ${state.state_id}`}
                >
                  <EuiPanel
                    paddingSize="none"
                    style={{
                      backgroundColor: "white",
                      border: `2px solid ${
                        selectedStateID === state.state_id
                          ? selectedNodeColor
                          : "black"
                      }`,
                      cursor: "pointer",
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "60px",
                      padding: "8px",
                    }}
                    onClick={() => setSelectedStateID(state.state_id)}
                  >
                    <EuiText>
                      <p
                        style={{
                          fontSize: "20px",
                          margin: "0",
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        [
                        {activeNodesMap.map(({ label, active }, idx) => {
                          const isSelected = selectedNodesLabel.includes(label);
                          return (
                            <span key={idx}>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleElementClick(label);
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.color = selectedNodeColor;
                                  e.currentTarget.style.fontWeight = "bold";
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.color = isSelected
                                    ? selectedNodeColor
                                    : "black";
                                  e.currentTarget.style.fontWeight = isSelected
                                    ? "bold"
                                    : "normal";
                                }}
                                style={{
                                  cursor: "pointer",
                                  color: isSelected
                                    ? selectedNodeColor
                                    : "black",
                                  fontWeight: isSelected ? "bold" : "normal",
                                  transition:
                                    "color 0.2s ease-in-out, font-weight 0.2s ease-in-out",
                                }}
                              >
                                {active}
                              </span>
                              {idx < activeNodesMap.length - 1 && ", "}
                            </span>
                          );
                        })}
                        ]
                      </p>
                    </EuiText>
                  </EuiPanel>
                </EuiToolTip>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiPanel paddingSize="s" style={{ width: "250px" }}>
                  <EuiTable>
                    <EuiTableBody>
                      <EuiTableRow>
                        <EuiTableHeaderCell>Attacker Cost</EuiTableHeaderCell>
                        <EuiTableHeaderCell>Defender Cost</EuiTableHeaderCell>
                      </EuiTableRow>
                      <EuiTableRow>
                        <EuiTableRowCell>
                          {cumulativeCosts.attackerObjective}
                        </EuiTableRowCell>
                        <EuiTableRowCell>
                          {cumulativeCosts.defenderObjective}
                        </EuiTableRowCell>
                      </EuiTableRow>
                    </EuiTableBody>
                  </EuiTable>
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m" />
          </React.Fragment>
        );
      })}
    </div>
  );
};
