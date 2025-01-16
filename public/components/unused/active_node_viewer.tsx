import React from "react";
import { useTreeContext } from "../tree_context";
import { TreePathVisualizer } from "./tree_path_visualizer";

// Interfaccia per i dati del grafo
interface TreeState {
  state_id: number; // Unique ID of the state
  active_nodes: number[]; // Nodes active in this state
  actions_id: number[]; // Actions associated with this state
  nodes: number[]; // Nodes associated with this state
}

// Props per il componente
interface ActiveNodeViewerProps {
  treeData: {
    nodes: { id: number; label: string }[]; // Node data for the tree
    edges: { id_source: number; id_target: number }[]; // Edges data for the tree
  };
  states: TreeState[]; // Array of tree states
}

export const ActiveNodeViewer: React.FC<ActiveNodeViewerProps> = ({
  treeData,
  states,
}) => {
  const { selectedState } = useTreeContext(); // Ottieni lo stato selezionato dal context
  const currentActiveNodes = states[selectedState]?.active_nodes || [];

  return (
    <div>
      {treeData && (
      <TreePathVisualizer data={treeData} activeNodes={currentActiveNodes} />
      )}
    </div>
  );
};
