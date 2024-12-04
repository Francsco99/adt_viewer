import React, { useEffect, useState } from "react";
import { EuiBasicTable, EuiSwitch, EuiSpacer, EuiBadge } from "@elastic/eui";
import { useTreeContext } from "./tree_context";
import { CoreStart } from "../../../../src/core/public";

interface NodeInfoProps {
  http: CoreStart["http"];
  notifications: CoreStart["notifications"];
}

interface Node {
  id: number;
  label: string;
  selected: boolean;
}

export const NodeInfo: React.FC<NodeInfoProps> = ({ http, notifications }) => {
  const { selectedNode } = useTreeContext();
  const [allNodes, setAllNodes] = useState<{ id: number; label: string }[]>([]);
  const [showAllNodes, setShowAllNodes] = useState(false); // Stato del toggle
  const [loading, setLoading] = useState(true); // Stato del caricamento

  // Stato per la paginazione
  const [pageIndex, setPageIndex] = useState(0); // Indice della pagina corrente
  const [pageSize, setPageSize] = useState(5); // Dimensione della pagina

  // Carica la lista di nodi dall'API
  useEffect(() => {
    setLoading(true);
    http
      .get("/api/adt_viewer/tree")
      .then((res) => {
        setAllNodes(res.tree?.nodes || []);
      })
      .catch(() => notifications.toasts.addDanger("Failed to load tree data"))
      .finally(() => setLoading(false));
  }, [http, notifications]);

  const rows: Node[] = showAllNodes
    ? allNodes.map((node) => ({
        id: node.id,
        label: node.label,
        selected: selectedNode?.data.id === node.id,
      }))
    : selectedNode
    ? [
        {
          id: selectedNode.data.id,
          label: selectedNode.data.label,
          selected: true,
        },
      ]
    : [];

  // Calcola gli elementi visibili in base alla pagina corrente
  const paginatedRows = showAllNodes
    ? rows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
    : rows;

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
    pageSizeOptions: [5, 10, 20], // Aggiunta delle opzioni per dimensione della pagina
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

  if (loading) {
    return <p>Loading node data...</p>;
  }

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
        items={paginatedRows}
        columns={columns}
        tableLayout="auto"
        pagination={pagination} // Sempre definito
        onChange={onTableChange}
      />
    </div>
  );
};
