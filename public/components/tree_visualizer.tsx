import React, { useEffect, useRef, useState } from "react";
import { hierarchy, tree } from "d3-hierarchy";
import { select, zoom, zoomIdentity, ZoomBehavior, D3ZoomEvent } from "d3";
import { useTreeContext } from "./tree_context";

// Define the structure of a tree node
interface TreeNode {
  id: number; // Node ID
  label: string; // Node label
  children?: TreeNode[]; // Child nodes
}

// Props for the TreeVisualizer component
interface TreeVisualizerProps {
  data: {
    nodes: { id: number; label: string }[]; // Node data
    edges: { id_source: number; id_target: number }[]; // Edge data
  };
  activeNodes?: number[]; // Nodes active in the current state
}

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  data,
  activeNodes = [],
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null); // Reference to the container div
  const svgRef = useRef<SVGSVGElement | null>(null); // Reference to the SVG element
  const gRef = useRef<SVGGElement | null>(null); // Reference to the group element
  const { selectedNodes, setSelectedNodes, activeNodeColor, selectedNodeColor } = useTreeContext(); // Context for selected nodes

  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown>>(); // Zoom behavior
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null); // Dimensions of the container

  // Initial zoom and position
  const [zoomTransform, setZoomTransform] = useState(() => {
    const initialScale = 0.6; // Default scale
    const initialX = dimensions?.width ? dimensions.width / 2 : 200; // Default X position
    const initialY = dimensions?.height ? dimensions.height / 4 : 70; // Default Y position
    return {
      x: initialX,
      y: initialY,
      k: initialScale,
    };
  });

  // Observe container resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = containerRef.current!.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height }); // Update dimensions
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect(); // Cleanup observer on unmount
  }, []);

  // Render and update the tree visualization
  useEffect(() => {
    if (!data || !svgRef.current || !gRef.current || !dimensions) return;

    const { nodes, edges } = data;
    const hierarchyData = buildHierarchy(nodes, edges); // Build hierarchical tree data

    if (!hierarchyData) {
      console.error("Root node could not be determined.");
      return;
    }

    const svg = select(svgRef.current); // Select SVG element
    const g = select(gRef.current); // Select group element

    g.selectAll("*").remove(); // Clear previous elements

    const root = hierarchy(hierarchyData);
    const treeLayout = tree<TreeNode>().nodeSize([100, 100]); // Define tree layout
    treeLayout(root); // Apply layout to hierarchical data

    // Draw links (edges)
    g.append("g")
      .selectAll("line")
      .data(root.links())
      .enter()
      .append("line")
      .attr("stroke", "gray")
      .attr("stroke-width", 2)
      .attr("x1", (d) => d.source.x ?? 0)
      .attr("y1", (d) => d.source.y ?? 0)
      .attr("x2", (d) => d.target.x ?? 0)
      .attr("y2", (d) => d.target.y ?? 0);

    // Draw nodes
    const nodesGroup = g
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("click", (event, d) => {
        // Toggle node selection on click
        if (selectedNodes.some((node) => node.data.id === d.data.id)) {
          setSelectedNodes(
            selectedNodes.filter((node) => node.data.id !== d.data.id)
          );
        } else {
          setSelectedNodes([...selectedNodes, d]);
        }
      });

    // Add ellipses for nodes
    nodesGroup
      .append("ellipse")
      .attr("rx", 40)
      .attr("ry", 30)
      .attr("fill", (d, i) => (activeNodes[i] === 1 ? activeNodeColor : "white")) // Active node color
      .attr("stroke", (d) =>
        selectedNodes.some((node) => node.data.id === d.data.id) ? selectedNodeColor : "black"
      )
      .attr("stroke-width", (d) =>
        selectedNodes.some((node) => node.data.id === d.data.id) ? 6 : 3
      );

    // Add labels for nodes
    nodesGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "30px")
      .attr("font-weight", (d) =>
        selectedNodes.some((node) => node.data.id === d.data.id)
          ? "bold"
          : "normal"
      )
      .attr("fill", "black")
      .text((d) => d.data.id);

    // Setup zoom behavior
    if (!zoomBehavior.current) {
      zoomBehavior.current = zoom<SVGSVGElement, unknown>().on(
        "zoom",
        (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
          g.attr(
            "transform",
            `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`
          );

          setZoomTransform({
            x: event.transform.x,
            y: event.transform.y,
            k: event.transform.k,
          });
        }
      );
    }

    svg.call(zoomBehavior.current); // Attach zoom behavior to SVG

    // Apply saved zoom transform
    svg.call(
      zoomBehavior.current.transform,
      zoomIdentity
        .translate(zoomTransform.x, zoomTransform.y)
        .scale(zoomTransform.k)
    );
  }, [
    data,
    activeNodes,
    selectedNodes,
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

// Function to build hierarchical data structure
function buildHierarchy(
  nodes: { id: number; label: string }[],
  edges: { id_source: number; id_target: number }[]
): TreeNode | null {
  const nodeMap: { [key: number]: TreeNode } = {}; // Map to store nodes by ID

  // Create nodes
  nodes.forEach((node) => {
    nodeMap[node.id] = { ...node, children: [] };
  });

  // Create edges between nodes
  edges.forEach((edge) => {
    const source = nodeMap[edge.id_source];
    const target = nodeMap[edge.id_target];
    if (source && target) {
      source.children?.push(target);
    }
  });

  // Determine the root node
  const rootNode = nodes.find(
    (node) => !edges.some((edge) => edge.id_target === node.id)
  );

  return rootNode ? nodeMap[rootNode.id] : null;
}
