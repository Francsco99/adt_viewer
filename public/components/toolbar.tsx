import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderLogo,
  EuiHeaderSectionItemButton,
  EuiToolTip,
  EuiIcon,
  EuiFilePicker,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
  EuiLoadingSpinner,
} from "@elastic/eui";
import { CoreStart } from "../../../../src/core/public";
import { useTreeContext } from "./tree_context";
import { loadData, uploadFile } from "./export_service";

interface ToolbarProps {
  currentStateIndex: number; // Current index of the state
  setCurrentStateIndex: React.Dispatch<React.SetStateAction<number>>; // Function to update the state index
  states: { state_id: number }[]; // List of states
  http: CoreStart["http"];
  notifications: CoreStart["notifications"];
  refreshPoliciesList: () => void;
  refreshTreesList: () => void;
}

interface ClearNodesButtonProps {
  selectedNodesCount: number; // Number of selected nodes
  onClear: () => void; // Function to clear selected nodes
}

// Button for clearing selected nodes with a notification badge
const ClearNodesButton = forwardRef<unknown, ClearNodesButtonProps>(
  ({ selectedNodesCount, onClear }, ref) => {
    const buttonRef = useRef<any>(null);

    // Animate button on clear
    const euiAnimate = useCallback(() => {
      buttonRef.current?.euiAnimate();
    }, []);

    // Expose animation function to parent
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

// Main toolbar component
export const Toolbar: React.FC<ToolbarProps> = ({
  currentStateIndex,
  setCurrentStateIndex,
  states,
  http,
  notifications,
  refreshPoliciesList,
  refreshTreesList,
}) => {
  const {
    selectedStateID,
    setSelectedStateID,
    selectedNodesLabel,
    setSelectedNodesLabel,
  } = useTreeContext(); // Access context values for selected state and nodes
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [isUploading, setIsUploading] = useState(false); // Uploading state

  const clearNodesRef = useRef<any>(null); // Reference to clear nodes button

  const currentIndex = states.findIndex((state) => state.state_id === selectedStateID); // Get index of current state

  // Navigate to previous state
  const goToPreviousState = () => {
    if (currentIndex > 0) {
      setSelectedStateID(states[currentIndex - 1].state_id);
    }
  };

  // Navigate to next state
  const goToNextState = () => {
    if (currentIndex < states.length - 1) {
      setSelectedStateID(states[currentIndex + 1].state_id);
    }
  };

  // Clear selected nodes and trigger animation
  const clearSelectedNodes = () => {
    setSelectedNodesLabel([]);
    clearNodesRef.current?.euiAnimate();
  };

  // Open modal for file upload
  const openModal = () => setIsModalOpen(true);

  // Close modal
  const closeModal = () => setIsModalOpen(false);

  // Handle file upload and load process
const handleFileUploading = async (file: File) => {
  if (file.type !== "text/xml") {
    notifications.toasts.addDanger("Only XML files are allowed.");
    return;
  }

  setIsUploading(true); // Show spinner

  const response = await uploadFile(http, notifications, file);

  if (response) {
    const { tree_json_id, policy_json_id } = response;
    console.log(response);
    // Carica i dati dal database invece di salvarli direttamente
    await loadData(http, notifications, tree_json_id, policy_json_id, {
      refreshPolicies: async () => refreshPoliciesList(),
      refreshTrees: async () => refreshTreesList(),
    });
  }

  setIsUploading(false); // Hide spinner
};


  // Handle file selection
  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    closeModal();

    await handleFileUploading(file);
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
            isDisabled={currentIndex <= 0} // Disable if at the first state
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

        {/* Clear Nodes Button */}
        <ClearNodesButton
          ref={clearNodesRef}
          selectedNodesCount={selectedNodesLabel.length}
          onClear={clearSelectedNodes}
        />
      </EuiHeaderSectionItem>

      {/* Upload Button */}
      <EuiHeaderSectionItem>
        <EuiToolTip position="bottom" content="Upload XML file">
          <EuiHeaderSectionItemButton aria-label="Upload XML" onClick={openModal}>
            <EuiIcon type="exportAction" />
          </EuiHeaderSectionItemButton>
        </EuiToolTip>
      </EuiHeaderSectionItem>

      {/* Modal for file upload */}
      {isModalOpen && (
        <EuiOverlayMask>
          <EuiModal onClose={closeModal} initialFocus="[name=filePicker]">
            <EuiModalHeader>
              <EuiModalHeaderTitle>
                {/* Modal title with spinner */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Upload XML File</span>
                  {isUploading && <EuiLoadingSpinner size="xl" />}
                </div>
              </EuiModalHeaderTitle>
            </EuiModalHeader>
            <EuiModalBody>
              <EuiFilePicker
                id="filePicker"
                name="filePicker"
                initialPromptText="Select or drag an XML file to upload"
                onChange={handleFileChange}
                accept=".xml"
              />
              <EuiSpacer size="m" />
            </EuiModalBody>
          </EuiModal>
        </EuiOverlayMask>
      )}
    </EuiHeaderSection>
  );
};
