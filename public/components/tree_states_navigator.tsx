import React, { useState, useEffect, useRef } from "react";
import { TreeVisualizer } from "./tree_visualizer";
import { useTreeContext } from "./tree_context";
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiModal, EuiModalBody, EuiModalHeader, EuiModalHeaderTitle, EuiOverlayMask, EuiText, EuiTitle, EuiToolTip } from "@elastic/eui";
import { FallbackMessage } from "./fallback_messages";

// Props for the TreeStateNavigator component
interface TreeStateNavigatorProps {
  treeData: {
    nodes: { id: number; label: string; name:string; role: string; type: string; hidden?: boolean; }[]; // Node data for the tree
    edges: { id_source: number; id_target: number }[]; // Edges data for the tree
  } | null;
}

// Component for navigating and visualizing tree states
export const TreeStateNavigator: React.FC<TreeStateNavigatorProps> = ({
  treeData,
}) => {
  const { selectedStateID, defenderNodeColor, attackerNodeColor, fixedNodeBorderColor, activeNodeColor, selectedNodeColor, fixedNodeColor } = useTreeContext();
  const svgRef = useRef<SVGSVGElement | null>(null); // Reference to the SVG element
  const [isModalVisible, setIsModalVisible] = useState(false);

  const closeModal = () => setIsModalVisible(false);
  const showModal = () => setIsModalVisible(true);

  // Add and remove `keydown` listener for Esc key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    if (isModalVisible) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    // Cleanup event listener
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalVisible]);

  // Fallback message when treeData is unavailable
    if (!treeData) {
      return (
        <FallbackMessage 
          title="Tree data not available"
          message="Please load the tree data to visualize the states."
        />
      );
    }

    // Function to download the SVG
    const downloadSVG = () => {
      if (!svgRef.current) return;

      const svgElement = svgRef.current;

      // Clone the SVG node
      const clonedSVG = svgElement.cloneNode(true) as SVGSVGElement;

      // Serialize the SVG content
      const serializer = new XMLSerializer();
      const svgContent = serializer.serializeToString(clonedSVG);

      // Create a Blob for the SVG
      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });

      // Create a download link
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "tree_visualization.svg";
      link.click();

      // Clean up the URL object
      URL.revokeObjectURL(link.href);
    };

  return (
    <div>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiTitle size="m">
            <h2>Attack Tree</h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiTitle size="m">
            <h2>
              State: <strong>{selectedStateID}</strong>
            </h2>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      {treeData && <TreeVisualizer ref={svgRef} data={treeData} />}
      <EuiToolTip position="right" content="Show legend">
        <EuiButtonIcon
          iconType="questionInCircle"
          onClick={showModal}
          aria-label="Show legend"
        />
      </EuiToolTip>

      {/* Button to download the SVG */}
      <EuiToolTip position="right" content="Download the current tree as SVG">
        <EuiButtonIcon iconType="download" onClick={downloadSVG} style={{ marginLeft: "20px" }}>
          Download SVG
        </EuiButtonIcon>
      </EuiToolTip>

      {isModalVisible && (
        <EuiOverlayMask>
          <EuiModal onClose={closeModal}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>
                <h2>Legend</h2>
              </EuiModalHeaderTitle>
            </EuiModalHeader>
            <EuiModalBody>
              <EuiText>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Defender Node */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <svg width="50" height="30" style={{ marginRight: "10px" }}>
                      <rect
                        width="40"
                        height="25"
                        x="5"
                        y="2.5"
                        fill= "white"
                        stroke={defenderNodeColor}
                        strokeWidth="2"
                      />
                    </svg>
                    <span style={{ verticalAlign: "middle" }}>Defender Node</span>
                  </div>

                  {/* Attacker Node */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <svg width="50" height="30" style={{ marginRight: "10px" }}>
                      <ellipse
                        cx="25"
                        cy="15"
                        rx="20"
                        ry="12.5"
                        fill= "white"
                        stroke= {attackerNodeColor}
                        strokeWidth="2"
                      />
                    </svg>
                    <span style={{ verticalAlign: "middle" }}>Attacker Node</span>
                  </div>

                  {/* Attacker Action Node */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <svg width="50" height="30" style={{ marginRight: "10px" }}>
                      <ellipse
                        cx="25"
                        cy="15"
                        rx="20"
                        ry="12.5"
                        fill= "white"
                        stroke= {attackerNodeColor}
                        strokeWidth="2"
                        strokeDasharray="15,5"
                      />
                    </svg>
                    <span style={{ verticalAlign: "middle" }}>Action Node</span>
                  </div>

                  {/* Selected Node */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <svg width="50" height="30" style={{ marginRight: "10px" }}>
                      <ellipse
                        cx="25"
                        cy="15"
                        rx="20"
                        ry="12.5"
                        fill="white"
                        stroke={selectedNodeColor}
                        strokeWidth="4"
                      />
                    </svg>
                    <span style={{ verticalAlign: "middle" }}>Selected Node</span>
                  </div>

                  {/* Active Node */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <svg width="50" height="30" style={{ marginRight: "10px" }}>
                      <ellipse
                        cx="25"
                        cy="15"
                        rx="20"
                        ry="12.5"
                        fill={activeNodeColor}
                        stroke= "white"
                        strokeWidth="2"
                      />
                    </svg>
                    <span style={{ verticalAlign: "middle" }}>Active Node</span>
                  </div>

                  {/* Fixed Node */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <svg width="50" height="30" style={{ marginRight: "10px" }}>
                      <ellipse
                        cx="25"
                        cy="15"
                        rx="20"
                        ry="12.5"
                        fill={fixedNodeColor}
                        stroke={fixedNodeBorderColor}
                        strokeWidth="2"
                      />
                    </svg>
                    <span style={{ verticalAlign: "middle" }}>Fixed Node</span>
                  </div>

                  {/* Blocked Node */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <svg width="50" height="30" style={{ marginRight: "10px" }}>
                    <ellipse
                        cx="25"
                        cy="15"
                        rx="20"
                        ry="12.5"
                        fill= "lightgray"
                        stroke= "gray"
                        strokeWidth="2"
                      />
                    </svg>
                    <span style={{ verticalAlign: "middle" }}>Blocked Node</span>
                  </div>
                </div>
              </EuiText>
            </EuiModalBody>
          </EuiModal>
        </EuiOverlayMask>
      )}
    </div>
  );
};