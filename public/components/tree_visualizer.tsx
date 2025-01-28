import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { hierarchy, tree } from "d3-hierarchy";
import {
  select,
  zoom,
  zoomIdentity,
  ZoomBehavior,
  D3ZoomEvent,
} from "d3";
import { useTreeContext } from "./tree_context";

// Define the structure of a tree node
interface TreeNode {
  id: number; // Node ID
  label: string; // Node label
  name: string;
  role: string;
  type: string;
  hidden?: boolean; // Optional attribute to determine hidden state
  parent?: TreeNode | null; // Parent reference for hierarchy
  children?: TreeNode[]; // Child nodes
}

// Props for the TreeVisualizer component
interface TreeVisualizerProps {
  data: {
    nodes: {
      id: number;
      label: string;
      name: string;
      role: string;
      type: string;
      hidden?: boolean;
    }[]; // Node data
    edges: { id_source: number; id_target: number }[]; // Edge data
  };
}

// Forward the ref to expose the SVG element
export const TreeVisualizer = forwardRef<SVGSVGElement | null, TreeVisualizerProps>(
  ({ data }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null); // Reference to the container div
    const svgRef = useRef<SVGSVGElement | null>(null); // Reference to the SVG element
    const gRef = useRef<SVGGElement | null>(null); // Reference to the group element
    const {
      activeNodes,
      selectedNodesLabel,
      setSelectedNodesLabel,
      activeNodeColor,
      fixedNodeColor,
      fixedNodeBorderColor,
      selectedNodeColor,
      defenderNodeColor,
      attackerNodeColor,
    } = useTreeContext();

    const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown>>(); // Zoom behavior
    const [dimensions, setDimensions] = useState<{
      width: number;
      height: number;
    } | null>(null); // Dimensions of the container

    // Expose the SVG element to the parent via ref
    useImperativeHandle(ref, () => svgRef.current!);

    // Initial zoom and position
    const [zoomTransform, setZoomTransform] = useState(() => {
      const initialScale = 0.3; // Default scale
      const initialX = dimensions?.width ? dimensions.width / 2 : 200; // Default X position
      const initialY = dimensions?.height ? dimensions.height / 4 : 70; // Default Y position
      return {
        x: initialX,
        y: initialY,
        k: initialScale,
      };
    });

    // Function to check if a node or its ancestors are hidden
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
          const nodeLabel = d.data.label;

          // Select all nodes with the same label
          const nodesWithSameLabel = data.nodes.filter(
            (node) => node.label === nodeLabel
          );

          const isAlreadySelected = nodesWithSameLabel.every((node) =>
            selectedNodesLabel.includes(node.label)
          );

          if (isAlreadySelected) {
            // Remove all nodes with this label from selection
            setSelectedNodesLabel(
              selectedNodesLabel.filter(
                (label) =>
                  !nodesWithSameLabel.some((node) => node.label === label)
              )
            );
          } else {
            // Add all nodes with this label to selection
            setSelectedNodesLabel([
              ...new Set([
                ...selectedNodesLabel,
                ...nodesWithSameLabel.map((node) => node.label),
              ]),
            ]);
          }
        });

      // Add shapes for nodes
      nodesGroup.each(function (d) {
        const group = select(this);

        // Determine the fill and border colors based on activeNodes value
        const activeNodeEntry = activeNodes.find(
          (node) => node.label === d.data.label
        );
        const fillColor = isHidden(d.data)
          ? "lightgray"
          : activeNodeEntry?.active === 2
          ? fixedNodeColor // Fixed color for active value 2
          : activeNodeEntry?.active === 1
          ? activeNodeColor // Active color for active value 1
          : "white"; // Default white for inactive nodes

        const strokeColor = isHidden(d.data)
          ? "gray"
          : activeNodeEntry?.active === 2
          ? fixedNodeBorderColor // Fixed border color for active value 2
          : selectedNodesLabel.includes(d.data.label)
          ? selectedNodeColor
          : d.data.role === "Defender"
          ? defenderNodeColor
          : attackerNodeColor;

        const strokeDashArray =
          d.data.type === "Action" && d.data.role === "Attacker" ? "15,5" : null;

        if (d.data.role === "Defender") {
          group
            .append("rect")
            .attr("width", 80)
            .attr("height", 50)
            .attr("x", -40)
            .attr("y", -25)
            .attr("fill", fillColor)
            .attr("stroke", strokeColor)
            .attr(
              "stroke-width",
              selectedNodesLabel.includes(d.data.label) ? 7 : 4
            )
            .attr("stroke-dasharray", strokeDashArray);
        } else {
          group
            .append("ellipse")
            .attr("rx", 40)
            .attr("ry", 30)
            .attr("fill", fillColor)
            .attr("stroke", strokeColor)
            .attr(
              "stroke-width",
              selectedNodesLabel.includes(d.data.label) ? 7 : 4
            )
            .attr("stroke-dasharray", strokeDashArray);
        }
      });

      // Add labels for nodes
      nodesGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("font-size", "30px")
        .attr("font-weight", (d) =>
          selectedNodesLabel.includes(d.data.label) ? "bold" : "normal"
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
      selectedNodesLabel,
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
  }
);

// Function to build hierarchical data structure
function buildHierarchy(
  nodes: {
    id: number;
    label: string;
    name: string;
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
