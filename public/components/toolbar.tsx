import React, { useState, useEffect } from "react";
import {
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiButtonIcon,
  EuiText,
  EuiHeaderLogo,
  EuiLoadingSpinner,
  EuiIcon,
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
  const { setSelectedState, selectedState } = useTreeContext();
  const [isCycling, setIsCycling] = useState(false); // Stato per il ciclo automatico

  const goToPreviousState = () => {
    if (currentStateIndex > 0) {
      const newIndex = currentStateIndex - 1;
      setCurrentStateIndex(newIndex);
      setSelectedState(states[newIndex].state_id); // Aggiorna lo stato selezionato
    }
  };

  const goToNextState = () => {
    if (currentStateIndex < states.length - 1) {
      const newIndex = currentStateIndex + 1;
      setCurrentStateIndex(newIndex);
      setSelectedState(states[newIndex].state_id); // Aggiorna lo stato selezionato
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
            // Ferma il ciclo se raggiunge l'ultimo stato
            setIsCycling(false);
            clearInterval(interval!);
            return prevIndex; // Ritorna l'ultimo indice
          }
          setSelectedState(states[newIndex].state_id); // Aggiorna lo stato selezionato
          return newIndex;
        });
      }, 2000); // Intervallo di 2 secondi
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCycling, setCurrentStateIndex, setSelectedState, states]);

  return (
    <EuiHeaderSection grow>
      {/* Logo */}
      <EuiHeaderSectionItem>
        <EuiHeaderLogo>ADT Visualizer</EuiHeaderLogo>
      </EuiHeaderSectionItem>

      {/* Stato Corrente e Controlli */}
      <EuiHeaderSectionItem border="none">
        {/* Controlli di Navigazione */}
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
        <EuiToolTip position="bottom" content={"Start cycling through states"}>
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
        <EuiIcon type="empty" />

        {/* Stato Corrente */}
        <EuiText>
          <h3>Current State: {selectedState}</h3>
        </EuiText>

        {isCycling && <EuiLoadingSpinner size="l" />}
      </EuiHeaderSectionItem>
    </EuiHeaderSection>
  );
};
