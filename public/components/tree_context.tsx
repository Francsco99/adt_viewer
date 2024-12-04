import React, { createContext, useContext, useState, ReactNode } from "react";

interface TreeContextType {
  selectedNode: any;
  setSelectedNode: (node: any) => void;
  selectedState: number;
  setSelectedState: (state: number) => void;
}

const TreeContext = createContext<TreeContextType | undefined>(undefined);

export const TreeContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedState, setSelectedState] = useState(0);

  return (
    <TreeContext.Provider
      value={{ selectedNode, setSelectedNode, selectedState, setSelectedState }}
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
