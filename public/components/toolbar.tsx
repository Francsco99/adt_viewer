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
  currentStateIndex: number;
  setCurrentStateIndex: React.Dispatch<React.SetStateAction<number>>;
  states: { state_id: number }[];
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentStateIndex,
  setCurrentStateIndex,
  states,
}) => {
  const { setSelectedState, selectedState } =
    useTreeContext();
  const [isCycling, setIsCycling] = useState(false);

  const goToPreviousState = () => {
    if (currentStateIndex > 0) {
      const newIndex = currentStateIndex - 1;
      setCurrentStateIndex(newIndex);
      setSelectedState(states[newIndex].state_id);
    }
  };

  const goToNextState = () => {
    if (currentStateIndex < states.length - 1) {
      const newIndex = currentStateIndex + 1;
      setCurrentStateIndex(newIndex);
      setSelectedState(states[newIndex].state_id);
    }
  };

  const startCycling = () => {
    setIsCycling(true);
  };

  const stopCycling = () => {
    setIsCycling(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isCycling) {
      interval = setInterval(() => {
        setCurrentStateIndex((prevIndex) => {
          const newIndex = prevIndex + 1;
          if (newIndex >= states.length) {
            setIsCycling(false);
            clearInterval(interval!);
            return prevIndex;
          }
          setSelectedState(states[newIndex].state_id);
          return newIndex;
        });
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCycling, setCurrentStateIndex, setSelectedState, states]);


  return (
      <EuiHeaderSection grow>
        <EuiHeaderSectionItem>
          <EuiHeaderLogo>ADT Visualizer</EuiHeaderLogo>
        </EuiHeaderSectionItem>

        <EuiHeaderSectionItem border="none">
          <EuiToolTip position="bottom" content={"Go to previous state"}>
            <EuiButtonIcon
              iconType="framePrevious"
              onClick={goToPreviousState}
              size="m"
              aria-label="Previous State"
              isDisabled={currentStateIndex <= 0}
            />
          </EuiToolTip>

          <EuiToolTip position="bottom" content={"Go to next state"}>
            <EuiButtonIcon
              iconType="frameNext"
              onClick={goToNextState}
              size="m"
              aria-label="Next State"
              isDisabled={currentStateIndex >= states.length - 1}
            />
          </EuiToolTip>

          <EuiToolTip
            position="bottom"
            content={"Start cycling through states"}
          >
            <EuiButtonIcon
              iconType="play"
              onClick={startCycling}
              size="m"
              aria-label="Start Cycling"
              isDisabled={isCycling}
            />
          </EuiToolTip>

          <EuiToolTip position="bottom" content={"Stop cycling through states"}>
            <EuiButtonIcon
              iconType="stop"
              onClick={stopCycling}
              size="m"
              aria-label="Stop Cycling"
              isDisabled={!isCycling}
            />
          </EuiToolTip>

          <EuiText>
            <span>Current State: </span>
            <span style={{fontWeight:"bold"}}> {selectedState}</span>
          </EuiText>

          {isCycling && <EuiLoadingSpinner size="l" />}
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
  );
};