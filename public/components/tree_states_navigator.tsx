import React from "react";
import { TreeVisualizer } from "./tree_visualizer";
import { useTreeContext } from "./tree_context";

// Define the structure of a TreeState
interface TreeState {
  state_id: number; // Unique ID of the state
  active_nodes: number[]; // Nodes active in this state
  actions_id: number[]; // Actions associated with this state
  nodes: number[]; // Nodes associated with this state
}

// Props for the TreeStateNavigator component
interface TreeStateNavigatorProps {
  treeData: {
    nodes: { id: number; label: string }[]; // Node data for the tree
    edges: { id_source: number; id_target: number }[]; // Edges data for the tree
  };
  states: TreeState[]; // Array of tree states
}

// Component for navigating and visualizing tree states
export const TreeStateNavigator: React.FC<TreeStateNavigatorProps> = ({
  treeData,
  states,
}) => {
  const { selectedState } = useTreeContext(); // Get the currently selected state from context
  const currentActiveNodes = states[selectedState]?.active_nodes || []; // Determine active nodes for the selected state

  return (
    <div>
      {/* Render the tree visualizer with the active nodes for the current state */}
      {treeData && (
        <TreeVisualizer data={treeData} activeNodes={currentActiveNodes} />
      )}
    </div>
  );
};
