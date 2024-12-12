import React from "react";
import { TreeStatesStepVisualizer } from "./tree_states_step_visualizer";
import { useTreeContext } from "./tree_context";

// Interfaccia per i dati del grafo
interface TreeData {
  nodes: { id: number; label: string }[];
  edges: { id_source: number; id_target: number }[];
}

// Interfaccia per lo stato della policy
interface TreeState {
  state_id: number; // ID univoco dello stato
  active_nodes: number[]; // Array binario che indica lo stato (1 = attivo, 0 = inattivo)
}

// Props per il componente
interface ActiveNodeViewerProps {
  treeData: TreeData; // Dati del grafo
  states: TreeState[]; // Array di stati della policy
}

export const ActiveNodeViewer: React.FC<ActiveNodeViewerProps> = ({
  treeData,
  states,
}) => {
  const { selectedState } = useTreeContext(); // Ottieni lo stato selezionato dal context

  // Ottieni i nodi attivi (array binario) per lo stato selezionato
  const currentActiveNodes = states[selectedState]?.active_nodes || [];

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <h3>Stato {selectedState}</h3>
      <TreeStatesStepVisualizer data={treeData} activeNodes={currentActiveNodes} />
    </div>
  );
};
