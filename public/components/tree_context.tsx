import React, { createContext, useContext, useState, ReactNode } from "react";

// Interface defining the context structure
interface TreeContextType {
  selectedNodes: any[]; // Array of selected nodes
  setSelectedNodes: (nodes: any[]) => void; // Function to update selected nodes
  selectedState: number; // Currently selected state ID
  setSelectedState: (state: number) => void; // Function to update selected state
  selectedPolicy: string; // Currently selected policy name
  setSelectedPolicy: (policy: string) => void; // Function to update selected policy
  states: any[]; // Array of all states
  setStates: (states: any[]) => void; // Function to update the states
}

// Create a context with an undefined initial value
const TreeContext = createContext<TreeContextType | undefined>(undefined);

// Provider component to manage and supply global state
export const TreeContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]); // State for selected nodes
  const [selectedState, setSelectedState] = useState(0); // State for the selected state ID
  const [selectedPolicy, setSelectedPolicy] = useState("policy.json"); // State for the selected policy
  const [states, setStates] = useState<any[]>([]); // State for the list of states

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
