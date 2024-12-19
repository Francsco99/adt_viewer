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
  const {
    selectedState,
    setSelectedState,
    selectedNodeColor,
    selectedNodes,
    setSelectedNodes,
  } = useTreeContext();

  const handleElementClick = (index: number) => {
    const updatedNodes = selectedNodes.includes(index)
      ? selectedNodes.filter((id) => id !== index)
      : [...selectedNodes, index];
    setSelectedNodes(updatedNodes);
  };

  const getActionDetails = (actionId: number) =>
    actions.find((action) => action.id === actionId);

  return (
    <div>
      {states.map((policy, index) => (
        <React.Fragment key={policy.state_id}>
          {/* Actions leading to current state */}
          {index > 0 &&
            policy.actions_id.map((actionId, actionIndex) => {
              const action = getActionDetails(actionId);
              return (
                <EuiFlexGroup
                  key={actionIndex}
                  alignItems="center"
                  justifyContent="center"
                  gutterSize="s"
                  direction="column"
                  style={{ marginBottom: "8px"}}
                >
                  <EuiFlexGroup alignItems="center" justifyContent="center" gutterSize="s">

                    {/* Icona sortDown centrata */}
                    <EuiFlexItem grow={false} style={{ textAlign: "center" }}>
                      <EuiIcon type="sortDown" size="l" />
                    </EuiFlexItem>

                    {/* Badge posizionati a sinistra */}
                    <EuiFlexItem grow={false} style={{ textAlign: "right" }}>
                      <EuiToolTip
                        position="top"
                        content={`Agent: ${action?.agent}, Cost: ${action?.cost}, Time: ${action?.time}`}
                      >
                        <EuiBadge
                          color={
                            action?.agent === "attacker" ? "danger" : "success"
                          }
                          style={{
                            cursor: "pointer",
                            display: "inline-block",
                          }}
                        >
                          {action?.action || "Unknown Action"}
                        </EuiBadge>
                      </EuiToolTip>
                    </EuiFlexItem>
                    
                  </EuiFlexGroup>
                </EuiFlexGroup>
              );
            })}

          {/* Clickable State Panel */}
          <EuiFlexGroup alignItems="center" justifyContent="center" gutterSize="m">
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
                    width: "300px",
                  }}
                  onClick={() => setSelectedState(policy.state_id)}
                >
                  <EuiText>
                    <p
                      style={{
                        fontSize: "18px",
                        margin: "0",
                        display: "flex",
                        gap: "4px",
                      }}
                    >
                      [
                      {policy.active_nodes.map((value, idx) => {
                        const isSelected = selectedNodes.includes(idx);

                        const prevValue =
                          index > 0 ? states[index - 1].active_nodes[idx] : null;
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
          </EuiFlexGroup>

          <EuiSpacer size="m" />
        </React.Fragment>
      ))}
    </div>
  );
};
