import React, { useEffect, useRef } from "react";
import { hierarchy, tree } from "d3-hierarchy";
import { select, zoom, zoomIdentity, ZoomBehavior, D3ZoomEvent } from "d3";

// Interfaccia per un nodo
interface TreeNode {
  id: number; // Node ID
  label: string; // Node label
  children?: TreeNode[]; // Child nodes
}

// Props per il componente
interface TreeStatesStepVisualizerProps {
  data: {
    nodes: { id: number; label: string }[]; // Node data
    edges: { id_source: number; id_target: number }[]; // Edge data
  };
  activeNodesByState: number[][]; // Array di array binari dei nodi attivi per ogni stato
  selectedState: number; // Stato selezionato
}

export const TreeStatesStepVisualizer: React.FC<TreeStatesStepVisualizerProps> = ({
  data,
  activeNodesByState,
  selectedState,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null); // Reference to the SVG element
  const gRef = useRef<SVGGElement | null>(null); // Reference to the group element
  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown>>(); // Zoom behavior

  // Funzione per costruire i dati gerarchici
  const buildHierarchy = (nodes: { id: number; label: string }[], edges: { id_source: number; id_target: number }[]) => {
    const nodeMap: { [key: number]: TreeNode } = {};
    nodes.forEach((node) => {
      nodeMap[node.id] = { ...node, children: [] };
    });

    edges.forEach((edge) => {
      const source = nodeMap[edge.id_source];
      const target = nodeMap[edge.id_target];
      if (source && target) {
        source.children?.push(target);
      }
    });

    return nodeMap[0] || null; // Assumiamo che il nodo con id 0 sia la radice
  };

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const { nodes, edges } = data;
    const hierarchyData = buildHierarchy(nodes, edges);

    if (!hierarchyData) {
      console.error("Root node could not be determined.");
      return;
    }

    const svg = select(svgRef.current);
    const g = select(gRef.current);

    // Costruisci la gerarchia con D3
    const root = hierarchy(hierarchyData);
    const treeLayout = tree<TreeNode>().nodeSize([100, 100]);
    treeLayout(root);

    // Calcola nodi ed archi cumulativi fino allo stato selezionato
    const cumulativeActiveNodes = new Set<number>();
    const cumulativeActiveEdges: { id_source: number; id_target: number }[] = [];

    for (let i = 0; i <= selectedState; i++) {
      const activeNodes = activeNodesByState[i];
      activeNodes.forEach((value, index) => {
        if (value === 1) {
          cumulativeActiveNodes.add(index);
        }
      });

      edges.forEach((edge) => {
        if (
          cumulativeActiveNodes.has(edge.id_source) &&
          cumulativeActiveNodes.has(edge.id_target)
        ) {
          cumulativeActiveEdges.push(edge);
        }
      });
    }

    // Aggiorna archi
    const links = g
      .selectAll(".link")
      .data(cumulativeActiveEdges, (d: any) => `${d.id_source}-${d.id_target}`);

    links
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("x1", (d) => root.descendants().find((node) => node.data.id === d.id_source)?.x || 0)
      .attr("y1", (d) => root.descendants().find((node) => node.data.id === d.id_source)?.y || 0)
      .attr("x2", (d) => root.descendants().find((node) => node.data.id === d.id_target)?.x || 0)
      .attr("y2", (d) => root.descendants().find((node) => node.data.id === d.id_target)?.y || 0);

    links.exit().remove();

    // Aggiorna nodi
    const nodesGroup = g
      .selectAll(".node")
      .data(
        root
          .descendants()
          .filter((d) => cumulativeActiveNodes.has(d.data.id)),
        (d) => d.data.id
      );

    const enterNodes = nodesGroup.enter().append("g").attr("class", "node");

    enterNodes.append("circle").attr("r", 20);
    enterNodes.append("text").attr("dy", 30);

    nodesGroup
      .merge(enterNodes as any)
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .select("circle")
      .attr("fill", "blue")
      .attr("stroke", "black");

    nodesGroup
      .merge(enterNodes as any)
      .select("text")
      .text((d) => d.data.label)
      .attr("fill", "black");

    nodesGroup.exit().remove();

    // Setup zoom behavior
    if (!zoomBehavior.current) {
      zoomBehavior.current = zoom<SVGSVGElement, unknown>().on(
        "zoom",
        (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
          g.attr("transform", event.transform.toString());
        }
      );
      svg.call(zoomBehavior.current);
    }
  }, [data, activeNodesByState, selectedState]);

  return (
    <svg ref={svgRef} style={{ width: "100%", height: "100%" }}>
      <g ref={gRef} />
    </svg>
  );
};
