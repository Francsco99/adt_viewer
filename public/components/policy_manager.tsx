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

interface PolicyManagerProps {
  policies: {
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

export const PolicyManager: React.FC<PolicyManagerProps> = ({
  policies,
  actions,
}) => {
  const { selectedState, setSelectedState } = useTreeContext();

  // Funzione per recuperare l'azione dato l'id
  const getActionDetails = (actionId: number) => {
    return actions.find((action) => action.id === actionId);
  };

  return (
    <div>
      <EuiSpacer size="m" />
      {policies.map((policy, index) => (
        <React.Fragment key={policy.state_id}>
          {/* Azioni che portano al corrente stato */}
          {index > 0 && (
            <React.Fragment>
              {policy.actions_id.map((actionId, actionIndex) => {
                const action = getActionDetails(actionId);
                return (
                  <EuiFlexGroup
                    key={actionIndex}
                    alignItems="center"
                    gutterSize="m"
                    style={{ marginLeft: "24px" }}
                  >
                    <EuiFlexItem grow={false}>
                      <EuiIcon type="arrowDown" size="l" />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiToolTip
                        position="top"
                        content={`Agent: ${action?.agent}, Cost: ${action?.cost}, Time: ${action?.time}`}
                      >
                        <EuiBadge
                          color={
                            action?.agent === "attacker" ? "danger" : "success"
                          }
                          style={{ cursor: "pointer" }}
                        >
                          {action?.action || "Unknown Action"}
                        </EuiBadge>
                      </EuiToolTip>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                );
              })}
            </React.Fragment>
          )}

          {/* Stato Cliccabile */}
          <EuiFlexGroup alignItems="center" gutterSize="m">
            <EuiFlexItem grow={false}>
              <EuiIcon type="dot" size="xl" color="primary" />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiPanel
                paddingSize="m"
                style={{
                  backgroundColor:
                    selectedState === policy.state_id ? "#d1eaff" : "#d3e5ff",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedState(policy.state_id)}
              >
                <EuiText>
                  <h3>State {policy.state_id}</h3>
                </EuiText>
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="m" />
        </React.Fragment>
      ))}
    </div>
  );
};
