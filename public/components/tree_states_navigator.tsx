import React from "react";
import { TreeVisualizer } from "./tree_visualizer";
import { useTreeContext } from "./tree_context";

interface TreeState {
  state_id: number;
  active_nodes: number[];
  actions_id: number[];
  nodes: number[];
}

interface TreeStateNavigatorProps {
  treeData: {
    nodes: { id: number; label: string }[];
    edges: { id_source: number; id_target: number }[];
  };
  states: TreeState[];
}

export const TreeStateNavigator: React.FC<TreeStateNavigatorProps> = ({
  treeData,
  states,
}) => {
  const { selectedState } = useTreeContext();
  const currentActiveNodes = states[selectedState]?.active_nodes || [];

  return (
    <div>
      {/* Visualizzatore dell'albero */}
      {treeData && (
        <TreeVisualizer data={treeData} activeNodes={currentActiveNodes} />
      )}
    </div>
  );
};
