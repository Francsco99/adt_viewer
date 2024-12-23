import React, { createContext, useContext, useState, ReactNode } from "react";

// Interface defining the context structure
interface TreeContextType {
  selectedNodes: number[]; // Array of selected nodes
  setSelectedNodes: (nodes: number[]) => void; // Function to update selected nodes
  selectedState: number; // Currently selected state ID
  setSelectedState: (state: number) => void; // Function to update selected state
  selectedPolicy: string; // Currently selected policy name
  setSelectedPolicy: (policy: string) => void; // Function to update selected policy
  states: any[]; // Array of all states
  setStates: (states: any[]) => void; // Function to update the states

  //Colors
  palette: string[]; // Array of colors
  getColor: (index: number) => string; // Function to get a color by index
  defenderColor: string; // Predefined color for defender
  attackerColor: string; // Predefined color for attacker
  totalColor: string;
  activeNodeColor: string;
  selectedNodeColor: string;
}

// Create a context with an undefined initial value
const TreeContext = createContext<TreeContextType | undefined>(undefined);

// Provider component to manage and supply global state
export const TreeContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]); // State for selected nodes
  const [selectedState, setSelectedState] = useState(0); // State for the selected state ID
  const [selectedPolicy, setSelectedPolicy] = useState("policy.json"); // State for the selected policy
  const [states, setStates] = useState<any[]>([]); // State for the list of states

  const palette = [
    "#003f5c",
    "#2f4b7c",
    "#665191",
    "#a05195",
    "#d45087",
    "#f95d6a",
    "#ff7c43",
    "#ffa600",
    "#7cb518"
  ];

  const getColor = (index: number) => palette[index % palette.length];
  const defenderColor = palette[1]; 
  const attackerColor = palette[5]; 
  const activeNodeColor = palette[7];
  const totalColor = palette[3];
  const selectedNodeColor = palette[8];

  return (
    <TreeContext.Provider
      value={{
        selectedNodes, // Provide selected nodes
        setSelectedNodes, // Provide function to update selected nodes
        selectedState, // Provide the current selected state ID
        setSelectedState, // Provide function to update the selected state
        selectedPolicy, // Provide the current selected policy
        setSelectedPolicy, // Provide function to update the selected policy
        states, // Provide the list of states
        setStates, // Provide function to update the list of states
        palette, // Provide the palette
        getColor, // Provide the helper function to get colors by index
        defenderColor, // Provide predefined defender color
        attackerColor, // Provide predefined attacker color
        totalColor,
        activeNodeColor, // Provide predefined active node color
        selectedNodeColor, // Provide predefined selected node color
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
