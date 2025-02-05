import React, { createContext, useContext, ReactNode } from "react";

// Interface defining the context structure
interface TreeContextType {
  selectedNodesID: number[]; // Array of selected nodes ids
  setSelectedNodesID: (nodes: number[]) => void; // Function to update selected nodes ids
  
  selectedNodesLabel: string[]; //Array of selected nodes labels
  setSelectedNodesLabel: (nodes: string[]) => void; // Function to update selected nodes labels

  selectedStateID: number; // Currently selected state ID
  setSelectedStateID: (state: number) => void; // Function to update selected state
  
  states: any[]; // Array of all states
  setStates: (states: any[]) => void; // Function to update the states

  activeNodes: any[];
  setActiveNodes: (activeNodes: any[]) => void;

  // Policy and Tree names, passed from App.tsx
  selectedPolicy: { id: number; name: string } | null;
  selectedTree: { id: number; name: string } | null;

  //Colors
  palette: string[]; // Array of colors
  getColor: (index: number) => string; // Function to get a color by index
  defenderColor: string; // Predefined color for defender
  attackerColor: string; // Predefined color for attacker
  totalColor: string;
  activeNodeColor: string;
  selectedNodeColor: string;
  defenderNodeColor: string;
  attackerNodeColor: string;
  fixedNodeColor: string;
  fixedNodeBorderColor: string,
}

// Create a context with an undefined initial value
const TreeContext = createContext<TreeContextType | undefined>(undefined);

// Provider component to manage and supply global state
export const TreeContextProvider: React.FC<{
  children: ReactNode;
  selectedPolicy: { id: number; name: string } | null; // Passed down from App.tsx
  selectedTree: { id: number; name: string } | null; // Passed down from App.tsx
}> = ({ children, selectedPolicy, selectedTree }) => {
  const [states, setStates] = React.useState<any[]>([]);
  const [selectedNodesID, setSelectedNodesID] = React.useState<number[]>([]);
  const [selectedNodesLabel, setSelectedNodesLabel] = React.useState<string[]>([]);
  const [selectedStateID, setSelectedStateID] = React.useState<number>(0);
  const [activeNodes, setActiveNodes] = React.useState<any[]>([]);
  
  const palette = ["#003f5c","#2f4b7c","#665191","#a05195","#d45087","#f95d6a","#ff7c43","#ffa600","#7cb518","#e63946","#0466c8"];
  const getColor = (index: number) => palette[index % palette.length];
  
  const defenderColor = "#2f4b7c";
  const attackerColor = "#f95d6a";
  const totalColor = "#a05195";
  
  const attackerNodeColor = "#e63946";
  const defenderNodeColor = "#7cb518";
  const selectedNodeColor = "#0466c8";

  const activeNodeColor = "#F4A4AC";
  
  const fixedNodeColor = "#D6F3A5";
  const fixedNodeBorderColor = "#567E10"; 
  
  return (
    <TreeContext.Provider
      value={{
        selectedNodesID, // Provide selected nodes ids
        setSelectedNodesID, // Provide function to update selected nodes
        
        selectedNodesLabel, // Provide selected nodes labels
        setSelectedNodesLabel, // Provide function to update selected nodes labels

        selectedStateID, // Provide the current selected state ID
        setSelectedStateID, // Provide function to update the selected state

        states, // Provide the list of states
        setStates, // Provide function to update the list of states

        activeNodes,
        setActiveNodes,
        // Names of current selected policy and tree files
        selectedPolicy,
        selectedTree,

        //Colors
        palette, 
        getColor,
        defenderColor,
        attackerColor,
        totalColor,
        activeNodeColor,
        selectedNodeColor,
        attackerNodeColor,
        defenderNodeColor,
        fixedNodeColor,
        fixedNodeBorderColor,
      }}
    >
      {children} {/* Render the child components */}
    </TreeContext.Provider>
  );
};

// Custom hook to access the TreeContext
export const useTreeContext = (): TreeContextType => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error("useTreeContext must be used within a TreeContextProvider");
  }
  return context; // Return the context
};
