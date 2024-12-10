import React, { createContext, useContext, useState, ReactNode } from "react";

interface TreeContextType {
  selectedNodes: any[]; // Array per i nodi selezionati
  setSelectedNodes: (nodes: any[]) => void; // Funzione per aggiornare i nodi selezionati
  selectedState: number;
  setSelectedState: (state: number) => void;
  selectedPolicy: string;
  setSelectedPolicy: (policy: string) => void;
  states: any[];
  setStates: (states: any[]) => void;
}

const TreeContext = createContext<TreeContextType | undefined>(undefined);

export const TreeContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]); // Stato per i nodi selezionati
  const [selectedState, setSelectedState] = useState(0);
  const [selectedPolicy, setSelectedPolicy] = useState("policy.json");
  const [states, setStates] = useState<any[]>([]);

  return (
    <TreeContext.Provider
      value={{
        selectedNodes,
        setSelectedNodes,
        selectedState,
        setSelectedState,
        selectedPolicy,
        setSelectedPolicy,
        states,
        setStates,
      }}
    >
      {children}
    </TreeContext.Provider>
  );
};

export const useTreeContext = (): TreeContextType => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error("useTreeContext must be used within a TreeContextProvider");
  }
  return context;
};
