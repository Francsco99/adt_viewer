import React from "react";
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
    state_id: number;
    active_nodes: number[];
    actions_id: number[];
    action_nodes: number[];
  }[];
  actions: {
    id: number;
    agent: string;
    action: string;
    cost: number;
    time: number;
  }[];
}

export const StatesVisualizer: React.FC<StatesVisualizerProps> = ({
  states,
  actions,
}) => {
  // Context for managing selected state and nodes
  const {
    selectedState,
    setSelectedState,
    selectedNodeColor,
    selectedNodes,
    setSelectedNodes,
  } = useTreeContext();

  // Toggle node selection
  const handleElementClick = (index: number) => {
    const updatedNodes = selectedNodes.includes(index)
      ? selectedNodes.filter((id) => id !== index)
      : [...selectedNodes, index];
    setSelectedNodes(updatedNodes);
  };

  // Retrieve action details by action ID
  const getActionDetails = (actionId: number) =>
    actions.find((action) => action.id === actionId);

  // Calculate cumulative costs for a given state
  const calculateCumulativeCosts = (stateIndex: number) => {
    let totalTimeAttacker = 0;
    let totalCostAttacker = 0;
    let totalTimeDefender = 0;
    let totalCostDefender = 0;

    for (let i = 1; i <= stateIndex; i++) {
      states[i].actions_id.forEach((actionId) => {
        const action = getActionDetails(actionId);
        if (action) {
          if (action.agent === "attacker") {
            totalTimeAttacker += action.time;
            totalCostAttacker += action.cost;
          } else if (action.agent === "defender") {
            totalTimeDefender += action.time;
            totalCostDefender += action.cost;
          }
        }
      });
    }

    const wt = 0.5; // Weight for time
    const wc = 0.5; // Weight for cost
    return {
      attackerObjective: wt * totalTimeAttacker + wc * totalCostAttacker,
      defenderObjective: wt * totalTimeDefender + wc * totalCostDefender,
    };
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {states.map((policy, index) => {
        const cumulativeCosts = calculateCumulativeCosts(index);
        return (
          <React.Fragment key={policy.state_id}>
            {/* Render transition actions and icon for states > 0 */}
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
                  {states[index].actions_id.map((actionId, actionIndex) => {
                    const action = getActionDetails(actionId);
                    return (
                      <EuiToolTip
                        key={actionIndex}
                        position="top"
                        content={`Agent: ${action?.agent}, Cost: ${action?.cost}, Time: ${action?.time}`}
                      >
                        <EuiBadge
                          color={
                            action?.agent === "attacker" ? "danger" : "success"
                          }
                          style={{
                            cursor: "pointer",
                            marginRight: "8px",
                          }}
                        >
                          {action?.action || "Unknown Action"}
                        </EuiBadge>
                      </EuiToolTip>
                    );
                  })}
                </EuiFlexItem>
              </EuiFlexGroup>
            )}

            {/* Render state panel and costs */}
            <EuiFlexGroup alignItems="center" gutterSize="m">
              <EuiFlexItem grow={false}>
                <EuiToolTip position="left" content={`State ID: ${policy.state_id}`}>
                  <EuiPanel
                    paddingSize="none"
                    style={{
                      backgroundColor: "white",
                      border: `2px solid ${
                        selectedState === policy.state_id
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
                    onClick={() => setSelectedState(policy.state_id)}
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
                        {policy.active_nodes.map((value, idx) => {
                          const isSelected = selectedNodes.includes(idx);
                          const prevValue =
                            index > 0
                              ? states[index - 1].active_nodes[idx]
                              : null;
                          const hasChanged =
                            prevValue !== null && prevValue !== value;

                          return (
                            <span key={idx}>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleElementClick(idx);
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.color = selectedNodeColor;
                                  e.currentTarget.style.fontWeight = "bold";
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.color = isSelected
                                    ? selectedNodeColor
                                    : "black";
                                  e.currentTarget.style.fontWeight =
                                    isSelected || hasChanged ? "bold" : "normal";
                                }}
                                style={{
                                  cursor: "pointer",
                                  color: isSelected
                                    ? selectedNodeColor
                                    : "black",
                                  fontWeight:
                                    isSelected || hasChanged ? "bold" : "normal",
                                  transition:
                                    "color 0.2s ease-in-out, font-weight 0.2s ease-in-out",
                                }}
                              >
                                {value}
                              </span>
                              {idx < policy.active_nodes.length - 1 && ", "}
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
