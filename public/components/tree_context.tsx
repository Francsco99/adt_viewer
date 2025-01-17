import React, { createContext, useContext, ReactNode } from "react";

// Interface defining the context structure
interface TreeContextType {
  selectedNodesID: number[]; // Array of selected nodes ids
  setSelectedNodesID: (nodes: number[]) => void; // Function to update selected nodes ids
  
  selectedNodesLabel: string[]; //Array of selected nodes labels
  setSelectedNodesLabel: (nodes: string[]) => void; // Function to update selected nodes labels

  selectedState: number; // Currently selected state ID
  setSelectedState: (state: number) => void; // Function to update selected state
  
  states: any[]; // Array of all states
  setStates: (states: any[]) => void; // Function to update the states

  // Policy and Tree names, passed from App.tsx
  selectedPolicy: string | null; // Name of the selected policy
  selectedTree: string | null; // Name of the selected tree

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
}

// Create a context with an undefined initial value
const TreeContext = createContext<TreeContextType | undefined>(undefined);

// Provider component to manage and supply global state
export const TreeContextProvider: React.FC<{
  children: ReactNode;
  selectedPolicy: string | null; // Passed down from App.tsx
  selectedTree: string | null; // Passed down from App.tsx
}> = ({ children, selectedPolicy, selectedTree }) => {
  const [states, setStates] = React.useState<any[]>([]);
  const [selectedNodesID, setSelectedNodesID] = React.useState<number[]>([]);
  const [selectedNodesLabel, setSelectedNodesLabel] = React.useState<string[]>([]);
  const [selectedState, setSelectedState] = React.useState<number>(0);

  const palette = ["#003f5c","#2f4b7c","#665191","#a05195","#d45087","#f95d6a","#ff7c43","#ffa600","#7cb518","#e63946","#0466c8"];
  const getColor = (index: number) => palette[index % palette.length];
  const defenderColor = palette[1]; 
  const attackerColor = palette[5]; 
  const activeNodeColor = palette[7];
  const totalColor = palette[3];
  const attackerNodeColor = palette[9];
  const defenderNodeColor = palette[8];
  const selectedNodeColor = palette[10];

  console.log(selectedTree);
  console.log(selectedPolicy);
  return (
    <TreeContext.Provider
      value={{
        selectedNodesID, // Provide selected nodes ids
        setSelectedNodesID, // Provide function to update selected nodes
        
        selectedNodesLabel, // Provide selected nodes labels
        setSelectedNodesLabel, // Provide function to update selected nodes labels

        selectedState, // Provide the current selected state ID
        setSelectedState, // Provide function to update the selected state
        states, // Provide the list of states
        setStates, // Provide function to update the list of states

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
