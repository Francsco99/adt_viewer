import React, { useEffect, useRef, useState } from "react";
import { hierarchy, tree } from "d3-hierarchy";
import { select, zoom, zoomIdentity, ZoomBehavior, D3ZoomEvent } from "d3";
import { useTreeContext } from "./tree_context";

interface TreeNode {
  id: number;
  label: string;
  children?: TreeNode[];
}

interface TreeVisualizerProps {
  data: {
    nodes: { id: number; label: string }[];
    edges: { id_source: number; id_target: number }[];
  };
  activeNodes?: number[]; // Nodi attivi per lo stato corrente
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  data,
  activeNodes = [],
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const { selectedNode, setSelectedNode } = useTreeContext();

  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown>>();
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [zoomTransform, setZoomTransform] = useState(() => {
    const initialScale = 0.6;
    // Calcolo iniziale delle dimensioni
    const initialX = dimensions?.width ? dimensions.width / 2 : 200; // Se `dimensions` non è disponibile, usa un valore predefinito
    const initialY = dimensions?.height ? dimensions.height / 4 : 70;
    return {
      x: initialX,
      y: initialY,
      k: initialScale,
    };
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = containerRef.current!.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current || !gRef.current || !dimensions) return;

    const { nodes, edges } = data;
    const hierarchyData = buildHierarchy(nodes, edges);

    if (!hierarchyData) {
      console.error("Root node could not be determined.");
      return;
    }

    const svg = select(svgRef.current);
    const g = select(gRef.current);

    // Rimuovi tutti gli elementi esistenti
    g.selectAll("*").remove();

    const root = hierarchy(hierarchyData);
    const treeLayout = tree<TreeNode>().nodeSize([100, 100]);
    treeLayout(root);

    g.append("g")
      .selectAll("line")
      .data(root.links())
      .enter()
      .append("line")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2)
      .attr("x1", (d) => d.source.x ?? 0)
      .attr("y1", (d) => d.source.y ?? 0)
      .attr("x2", (d) => d.target.x ?? 0)
      .attr("y2", (d) => d.target.y ?? 0);

    const nodesGroup = g
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("click", (event, d) => {
        if(selectedNode && selectedNode.data.id === d.data.id){
          setSelectedNode(null);
        }
        else{
        setSelectedNode(d);
        }
      });

    nodesGroup
      .append("ellipse")
      .attr("rx", 40)
      .attr("ry", 30)
      .attr("fill", (d, i) => (activeNodes[i] === 1 ? "pink" : "white"))
      .attr("stroke", (d) =>
        selectedNode && selectedNode.data.id === d.data.id ? "red" : "red"
      )
      .attr("stroke-width", (d) =>
        selectedNode && selectedNode.data.id === d.data.id ? 5 : 3
      );

    nodesGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "30px")
      .attr("font-weight", (d) =>
        selectedNode && selectedNode.data.id === d.data.id ? "bold" : "normal"
      )
      .attr("fill", "black")
      .text((d) => d.data.id);

    if (!zoomBehavior.current) {
      zoomBehavior.current = zoom<SVGSVGElement, unknown>().on(
        "zoom",
        (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
          g.attr(
            "transform",
            `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`
          );

          // Salva la trasformazione attuale nello stato
          setZoomTransform({
            x: event.transform.x,
            y: event.transform.y,
            k: event.transform.k,
          });
        }
      );
    }

    svg.call(zoomBehavior.current);

    // Applica la trasformazione salvata
    svg.call(
      zoomBehavior.current.transform,
      zoomIdentity
        .translate(zoomTransform.x, zoomTransform.y)
        .scale(zoomTransform.k)
    );
  }, [
    data,
    activeNodes,
    selectedNode,
    dimensions,
    zoomTransform.x,
    zoomTransform.y,
    zoomTransform.k,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {dimensions && (
        <svg
          ref={svgRef}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "400px",
          }}
        >
          <g ref={gRef} />
        </svg>
      )}
    </div>
  );
};

function buildHierarchy(
  nodes: { id: number; label: string }[],
  edges: { id_source: number; id_target: number }[]
): TreeNode | null {
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

  const rootNode = nodes.find(
    (node) => !edges.some((edge) => edge.id_target === node.id)
  );

  return rootNode ? nodeMap[rootNode.id] : null;
}
