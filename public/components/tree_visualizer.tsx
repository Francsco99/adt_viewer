import React, { useEffect, useRef, useState } from "react";
import { hierarchy, tree } from "d3-hierarchy";
import { select, zoom, zoomIdentity, ZoomBehavior, D3ZoomEvent } from "d3";
import { useTreeContext } from "./tree_context";

// Define the structure of a tree node
interface TreeNode {
  id: number; // Node ID
  label: string; // Node label
  role: string;
  type: string;
  hidden?: boolean; // NEW: Optional attribute to determine hidden state
  parent?: TreeNode | null; // NEW: Parent reference for hierarchy
  children?: TreeNode[]; // Child nodes
}

// Props for the TreeVisualizer component
interface TreeVisualizerProps {
  data: {
    nodes: {
      id: number;
      label: string;
      role: string;
      type: string;
      hidden?: boolean;
    }[]; // Node data
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
  const {
    selectedNodes,
    setSelectedNodes,
    activeNodeColor,
    selectedNodeColor,
    defenderNodeColor,
    attackerNodeColor,
  } = useTreeContext(); // Context for selected nodes

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

  // NEW: Function to check if a node or its ancestors are hidden
  function isHidden(node: TreeNode): boolean {
    return node.hidden || (node.parent ? isHidden(node.parent) : false);
  }

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
      .attr("stroke", (d) => (isHidden(d.target.data) ? "gray" : "gray")) // Gray for hidden nodes
      .attr("stroke-width", (d) => (isHidden(d.target.data) ? 1 : 2)) // Thinner for hidden nodes
      .attr("stroke-dasharray", (d) =>
        d.target.data.role === "Defender" ? "5,5" : null
      )
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
        //const nodeId = d.data.id;
        const nodeLabel = d.data.label;

        // Select all nodes with the same label
        const nodesWithSameLabel = data.nodes.filter(
          (node) => node.label === nodeLabel
        );
        const nodeIdsWithSameLabel = nodesWithSameLabel.map((node) => node.id);

        const isAlreadySelected = nodeIdsWithSameLabel.every((id) =>
          selectedNodes.includes(id)
        );

        if (isAlreadySelected) {
          setSelectedNodes(
            selectedNodes.filter((id) => !nodeIdsWithSameLabel.includes(id))
          );
        } else {
          setSelectedNodes([
            ...new Set([...selectedNodes, ...nodeIdsWithSameLabel]),
          ]);
        }
      });

    // Add shapes for nodes
    nodesGroup.each(function (d) {
      const group = select(this);
      const fillColor = isHidden(d.data)
        ? "lightgray"
        : activeNodes[d.data.id] === 1
        ? activeNodeColor
        : "white";
      const strokeColor = isHidden(d.data)
        ? "gray"
        : selectedNodes.includes(d.data.id)
        ? selectedNodeColor
        : d.data.role === "Defender"
        ? defenderNodeColor
        : attackerNodeColor;

      if (d.data.role === "Defender") {
        group
          .append("rect")
          .attr("width", 80)
          .attr("height", 50)
          .attr("x", -40)
          .attr("y", -25)
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", selectedNodes.includes(d.data.id) ? 7 : 4);
      } else {
        group
          .append("ellipse")
          .attr("rx", 40)
          .attr("ry", 30)
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", selectedNodes.includes(d.data.id) ? 7 : 4);
      }
    });

    // Add labels for nodes
    nodesGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "30px")
      .attr("font-weight", (d) =>
        selectedNodes.includes(d.data.id) ? "bold" : "normal"
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
  nodes: {
    id: number;
    label: string;
    role: string;
    type: string;
    hidden?: boolean;
  }[],
  edges: { id_source: number; id_target: number }[]
): TreeNode | null {
  const nodeMap: { [key: number]: TreeNode } = {};

  nodes.forEach((node) => {
    nodeMap[node.id] = { ...node, children: [], parent: null }; // Add parent as null
  });

  edges.forEach((edge) => {
    const source = nodeMap[edge.id_source];
    const target = nodeMap[edge.id_target];
    if (source && target) {
      source.children?.push(target);
      target.parent = source; // Update parent reference
    }
  });

  // Determine the root node
  const rootNode = nodes.find(
    (node) => !edges.some((edge) => edge.id_target === node.id)
  );

  return rootNode ? nodeMap[rootNode.id] : null;
}
