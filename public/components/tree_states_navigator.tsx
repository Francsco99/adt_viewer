import React from "react";
import { TreeVisualizer } from "./tree_visualizer";
import { useTreeContext } from "./tree_context";
import { EuiFlexGroup, EuiFlexItem, EuiTitle } from "@elastic/eui";

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
    nodes: { id: number; label: string; name:string; role: string; type: string; hidden?: boolean; }[]; // Node data for the tree
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
 
  return (
    <div>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiTitle size="m">
            <h2>Attack Tree</h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiTitle size="m">
            <h2 >State: <strong>{selectedState}</strong></h2>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      {/* Render the tree visualizer with the active nodes for the current state */}
      {treeData && (
        <TreeVisualizer data={treeData}/>
      )}
    </div>
  );
};
