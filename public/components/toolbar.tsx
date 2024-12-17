import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderLogo,
  EuiHeaderSectionItemButton,
  EuiToolTip,
  EuiIcon,
  EuiText,
  EuiLoadingSpinner,
} from "@elastic/eui";
import { useTreeContext } from "./tree_context";

interface ToolbarProps {
  currentStateIndex: number; // Current index of the state
  setCurrentStateIndex: React.Dispatch<React.SetStateAction<number>>; // Function to update the state index
  states: { state_id: number }[]; // List of states
}

interface ClearNodesButtonProps {
  selectedNodesCount: number; // Number of selected nodes
  onClear: () => void; // Function to clear selected nodes
}

// Clear nodes button with notification badge
const ClearNodesButton = forwardRef<unknown, ClearNodesButtonProps>(
  ({ selectedNodesCount, onClear }, ref) => {
    const buttonRef = useRef<any>(null);

    // Animate the button when clearing nodes
    const euiAnimate = useCallback(() => {
      buttonRef.current?.euiAnimate();
    }, []);

    // Expose the animate function to the parent
    useImperativeHandle(ref, () => ({
      euiAnimate,
    }));

    return (
      <EuiToolTip position="bottom" content="Clear nodes selection">
        <EuiHeaderSectionItemButton
          ref={buttonRef}
          aria-label="Clear nodes selection"
          notification={selectedNodesCount > 0 ? selectedNodesCount : undefined} // Show badge if nodes are selected
          onClick={onClear}
        >
          <EuiIcon type="broom" />
        </EuiHeaderSectionItemButton>
      </EuiToolTip>
    );
  }
);

ClearNodesButton.displayName = "ClearNodesButton";

// Toolbar component for state navigation and controls
export const Toolbar: React.FC<ToolbarProps> = ({
  currentStateIndex,
  setCurrentStateIndex,
  states,
}) => {
  const {
    setSelectedState,
    selectedState,
    selectedNodes,
    setSelectedNodes,
  } = useTreeContext(); // Access context values for selected state and nodes
  const [isCycling, setIsCycling] = useState(false); // Cycling state indicator

  const clearNodesRef = useRef<any>(null); // Reference to trigger animation on clear nodes

  // Navigate to the previous state
  const goToPreviousState = () => {
    if (currentStateIndex > 0) {
      setCurrentStateIndex(currentStateIndex - 1);
      setSelectedState(states[currentStateIndex - 1].state_id);
    }
  };

  // Navigate to the next state
  const goToNextState = () => {
    if (currentStateIndex < states.length - 1) {
      setCurrentStateIndex(currentStateIndex + 1);
      setSelectedState(states[currentStateIndex + 1].state_id);
    }
  };

  // Start cycling through states
  const startCycling = () => setIsCycling(true);

  // Stop cycling through states
  const stopCycling = () => setIsCycling(false);

  // Clear the selected nodes and animate the button
  const clearSelectedNodes = () => {
    setSelectedNodes([]);
    clearNodesRef.current?.euiAnimate();
  };

  return (
    <EuiHeaderSection grow>
      {/* Logo */}
      <EuiHeaderSectionItem>
        <EuiHeaderLogo>ADT Manager</EuiHeaderLogo>
      </EuiHeaderSectionItem>

      {/* Toolbar Buttons */}
      <EuiHeaderSectionItem>
        {/* Previous State */}
        <EuiToolTip position="bottom" content="Go to previous state">
          <EuiHeaderSectionItemButton
            aria-label="Previous State"
            isDisabled={currentStateIndex <= 0} // Disable if at the first state
            onClick={goToPreviousState}
          >
            <EuiIcon type="framePrevious" />
          </EuiHeaderSectionItemButton>
        </EuiToolTip>

        {/* Next State */}
        <EuiToolTip position="bottom" content="Go to next state">
          <EuiHeaderSectionItemButton
            aria-label="Next State"
            isDisabled={currentStateIndex >= states.length - 1} // Disable if at the last state
            onClick={goToNextState}
          >
            <EuiIcon type="frameNext" />
          </EuiHeaderSectionItemButton>
        </EuiToolTip>

        {/* Start Cycling */}
        <EuiToolTip position="bottom" content="Start cycling through states">
          <EuiHeaderSectionItemButton
            aria-label="Start Cycling"
            isDisabled={isCycling} // Disable if already cycling
            onClick={startCycling}
          >
            <EuiIcon type="play" />
          </EuiHeaderSectionItemButton>
        </EuiToolTip>

        {/* Stop Cycling */}
        <EuiToolTip position="bottom" content="Stop cycling through states">
          <EuiHeaderSectionItemButton
            aria-label="Stop Cycling"
            isDisabled={!isCycling} // Disable if not cycling
            onClick={stopCycling}
          >
            <EuiIcon type="stop" />
          </EuiHeaderSectionItemButton>
        </EuiToolTip>

        {/* Clear Nodes Button */}
        <ClearNodesButton
          ref={clearNodesRef}
          selectedNodesCount={selectedNodes.length}
          onClear={clearSelectedNodes}
        />

        {/* Current State Display */}
        <EuiText>
          <span>Current State: </span>
          <span style={{ fontWeight: "bold" }}>{selectedState}</span>
        </EuiText>

        {/* Cycling Indicator */}
        {isCycling && <EuiLoadingSpinner size="l" />}
      </EuiHeaderSectionItem>
    </EuiHeaderSection>
  );
};
