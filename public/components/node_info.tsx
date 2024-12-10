import React, { useState } from "react";
import { EuiBasicTable, EuiSwitch, EuiSpacer, EuiBadge } from "@elastic/eui";
import { useTreeContext } from "./tree_context";
import { CoreStart } from "../../../../src/core/public";

interface NodeInfoProps {
  http: CoreStart["http"];
  notifications: CoreStart["notifications"];
  treeData: { nodes: { id: number; label: string }[] } | null; // Permetti `null`
}

interface Node {
  id: number;
  label: string;
  selected: boolean;
}

export const NodeInfo: React.FC<NodeInfoProps> = ({ http, notifications, treeData }) => {
  const { selectedNodes } = useTreeContext(); // Usa il contesto per i nodi selezionati
  const [showAllNodes, setShowAllNodes] = useState(false); // Stato per il toggle
  const [pageIndex, setPageIndex] = useState(0); // Indice della pagina corrente
  const [pageSize, setPageSize] = useState(5); // Dimensione della pagina
  
  if (!treeData) {
    return <p>Loading tree data...</p>;
  }

  // Genera le righe della tabella
  const rows: Node[] = showAllNodes
    ? treeData.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        selected: selectedNodes.some((n) => n.data.id === node.id),
      }))
    : selectedNodes.map((node) => ({
        id: node.data.id,
        label: node.data.label,
        selected: true,
      }));

  // Calcola gli elementi visibili in base alla pagina corrente
  const paginatedRows = rows.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  const columns = [
    {
      field: "id",
      name: "ID",
      sortable: true,
    },
    {
      field: "label",
      name: "Label",
    },
    {
      field: "selected",
      name: "Selected",
      render: (isSelected: boolean) => (
        <EuiBadge color={isSelected ? "success" : "default"}>
          {isSelected ? "Yes" : "No"}
        </EuiBadge>
      ),
    },
  ];

  // Configura la paginazione
  const pagination = {
    pageIndex,
    pageSize,
    totalItemCount: rows.length,
    pageSizeOptions: [5, 10, 20], // Opzioni per dimensione della pagina
  };

  const onTableChange = ({
    page,
  }: {
    page: { index: number; size: number };
  }) => {
    if (page) {
      setPageIndex(page.index); // Aggiorna l'indice della pagina
      setPageSize(page.size); // Aggiorna la dimensione della pagina
    }
  };

  return (
    <div>
      <EuiSwitch
        label="Show all nodes"
        checked={showAllNodes}
        onChange={(e) => {
          setShowAllNodes(e.target.checked);
          setPageIndex(0); // Resetta alla prima pagina
        }}
      />
      <EuiSpacer size="m" />
      <EuiBasicTable<Node>
        items={paginatedRows} // Mostra solo le righe della pagina corrente
        columns={columns}
        tableLayout="auto"
        pagination={pagination} // Configura la paginazione
        onChange={onTableChange} // Gestione del cambio pagina
      />
    </div>
  );
};
