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
  const { selectedState, setSelectedState } = useTreeContext();

  // Funzione per recuperare l'azione dato l'id
  const getActionDetails = (actionId: number) => {
    return actions.find((action) => action.id === actionId);
  };

  return (
    <div>
      {states.map((policy, index) => (
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
                    justifyContent="center" // Centra orizzontalmente il contenuto
                    gutterSize="s" // Spaziatura ridotta tra l'icona e il badge
                    style={{ marginLeft: "24px" }}
                  >
                    <EuiFlexItem grow={false}>
                      <EuiIcon type="arrowDown" size="l" />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
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

          {/* Stato Cliccabile con tooltip */}
          <EuiFlexGroup alignItems="center" gutterSize="m">
            <EuiFlexItem>
              <EuiToolTip
                position="left"
                content={`State ID: ${policy.state_id}`} // Tooltip con ID dello stato
              >
                <EuiPanel
                  paddingSize="none" // Rimuove il padding interno
                  style={{
                    backgroundColor: "white", // Sfondo bianco
                    border: `2px solid ${
                      selectedState === policy.state_id ? "#c1121f" : "#669bbc"
                    }`, // Bordo rosso bordeaux se selezionato, altrimenti blu
                    cursor: "pointer",
                    textAlign: "center", // Centra orizzontalmente il testo
                    display: "flex",
                    justifyContent: "center", // Centra orizzontalmente il contenuto
                    alignItems: "center", // Centra verticalmente il contenuto
                    height: "60px", // Altezza rettangolo
                  }}
                  onClick={() => setSelectedState(policy.state_id)}
                >
                  <EuiText>
                    <p
                      style={{
                        fontSize: "20px", // Font più grande per il vettore
                        margin: "0", // Rimuove margini
                      }}
                    >
                      [{policy.active_nodes.join(", ")}] {/* Converte array in stringa con virgole */}
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
