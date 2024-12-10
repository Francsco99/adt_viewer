import React, { useState, useEffect } from "react";
import {
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiButtonIcon,
  EuiText,
  EuiHeaderLogo,
  EuiLoadingSpinner,
  EuiToolTip,
} from "@elastic/eui";
import { useTreeContext } from "./tree_context";

interface ToolbarProps {
  currentStateIndex: number; // Index of the current state
  setCurrentStateIndex: React.Dispatch<React.SetStateAction<number>>; // Function to update the current state index
  states: { state_id: number }[]; // List of states
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentStateIndex,
  setCurrentStateIndex,
  states,
}) => {
  const { setSelectedState, selectedState } = useTreeContext(); // Context for the selected state
  const [isCycling, setIsCycling] = useState(false); // Indicates if cycling through states is active

  // Navigate to the previous state
  const goToPreviousState = () => {
    if (currentStateIndex > 0) {
      const newIndex = currentStateIndex - 1;
      setCurrentStateIndex(newIndex);
      setSelectedState(states[newIndex].state_id);
    }
  };

  // Navigate to the next state
  const goToNextState = () => {
    if (currentStateIndex < states.length - 1) {
      const newIndex = currentStateIndex + 1;
      setCurrentStateIndex(newIndex);
      setSelectedState(states[newIndex].state_id);
    }
  };

  // Start cycling through states
  const startCycling = () => {
    setIsCycling(true);
  };

  // Stop cycling through states
  const stopCycling = () => {
    setIsCycling(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // Automatically navigate through states if cycling is active
    if (isCycling) {
      interval = setInterval(() => {
        setCurrentStateIndex((prevIndex) => {
          const newIndex = prevIndex + 1;
          if (newIndex >= states.length) {
            setIsCycling(false); // Stop cycling when reaching the last state
            clearInterval(interval!);
            return prevIndex;
          }
          setSelectedState(states[newIndex].state_id);
          return newIndex;
        });
      }, 2000); // Change state every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval); // Cleanup the interval on unmount
    };
  }, [isCycling, setCurrentStateIndex, setSelectedState, states]);

  return (
    <EuiHeaderSection grow>
      {/* Logo */}
      <EuiHeaderSectionItem>
        <EuiHeaderLogo>ADT Manager</EuiHeaderLogo>
      </EuiHeaderSectionItem>

      {/* Toolbar Buttons */}
      <EuiHeaderSectionItem border="none">
        {/* Previous State */}
        <EuiToolTip position="bottom" content={"Go to previous state"}>
          <EuiButtonIcon
            iconType="framePrevious"
            onClick={goToPreviousState}
            size="m"
            aria-label="Previous State"
            isDisabled={currentStateIndex <= 0} // Disable if on the first state
          />
        </EuiToolTip>

        {/* Next State */}
        <EuiToolTip position="bottom" content={"Go to next state"}>
          <EuiButtonIcon
            iconType="frameNext"
            onClick={goToNextState}
            size="m"
            aria-label="Next State"
            isDisabled={currentStateIndex >= states.length - 1} // Disable if on the last state
          />
        </EuiToolTip>

        {/* Start Cycling */}
        <EuiToolTip position="bottom" content={"Start cycling through states"}>
          <EuiButtonIcon
            iconType="play"
            onClick={startCycling}
            size="m"
            aria-label="Start Cycling"
            isDisabled={isCycling} // Disable if cycling is already active
          />
        </EuiToolTip>

        {/* Stop Cycling */}
        <EuiToolTip position="bottom" content={"Stop cycling through states"}>
          <EuiButtonIcon
            iconType="stop"
            onClick={stopCycling}
            size="m"
            aria-label="Stop Cycling"
            isDisabled={!isCycling} // Disable if cycling is not active
          />
        </EuiToolTip>

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
