import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderLogo,
  EuiHeaderSectionItemButton,
  EuiToolTip,
  EuiIcon,
  EuiFilePicker,
  EuiButton,
  EuiModal,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
} from "@elastic/eui";
import { CoreStart } from "../../../../src/core/public";
import { useTreeContext } from "./tree_context";

interface ToolbarProps {
  currentStateIndex: number; // Current index of the state
  setCurrentStateIndex: React.Dispatch<React.SetStateAction<number>>; // Function to update the state index
  states: { state_id: number }[]; // List of states
  http: CoreStart["http"];
  notifications: CoreStart["notifications"];
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
  http,
  notifications,
}) => {
  const {
    setSelectedState,
    selectedNodesID,
    setSelectedNodesID,
  } = useTreeContext(); // Access context values for selected state and nodes
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  // Clear the selected nodes and animate the button
  const clearSelectedNodes = () => {
    setSelectedNodesID([]);
    clearNodesRef.current?.euiAnimate();
  };

  // Funzione per aprire il modale
  const openModal = () => setIsModalOpen(true);

  // Funzione per chiudere il modale
  const closeModal = () => setIsModalOpen(false);

  const handleFileUploading = async (file: File) => {
    if (file.type !== "text/xml") {
      notifications.toasts.addDanger("Only XML files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Invio del file XML al server Python
      const response = await http.post("http://localhost:5002/receive_xml", {
        body: formData, // FormData viene passato direttamente
        headers: {
          "Content-Type": undefined, // Lascia che il browser gestisca il boundary del multipart
        },
      });

      if (!response || typeof response !== "object" || !response.data) {
        throw new Error("Invalid response from server.");
      }

      const { file_name, data } = response;

      if (!file_name || !data) {
        throw new Error("Response is missing file_name or data.");
      }

      // Salva il file JSON generato dal server
      await http.post(`/api/adt_viewer/save_tree/${file_name}`, {
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Notifica di successo
      notifications.toasts.addSuccess(
        `File saved successfully as ${file_name} in server/data/trees`
      );
    } catch (error) {
      console.error("Error during file upload and save process:", error);
      notifications.toasts.addDanger(
        `Error during file upload and save process: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    await handleFileUploading(file);

    closeModal();
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


        {/* Clear Nodes Button */}
        <ClearNodesButton
          ref={clearNodesRef}
          selectedNodesCount={selectedNodesID.length}
          onClear={clearSelectedNodes}
        />
      </EuiHeaderSectionItem>

      {/* Upload Button */}
      <EuiHeaderSectionItem>
        <EuiToolTip position="bottom" content="Upload XML file">
          <EuiHeaderSectionItemButton aria-label="Upload XML" onClick={openModal}>
            <EuiIcon type="importAction" />
          </EuiHeaderSectionItemButton>
        </EuiToolTip>
      </EuiHeaderSectionItem>

      {/* Modal */}
      {isModalOpen && (
        <EuiOverlayMask>
          <EuiModal onClose={closeModal} initialFocus="[name=filePicker]">
            <EuiModalHeader>
              <EuiModalHeaderTitle>Upload XML File</EuiModalHeaderTitle>
            </EuiModalHeader>
            <EuiModalBody>
              <EuiFilePicker
                id="filePicker"
                name="filePicker"
                initialPromptText="Select an XML file to upload"
                onChange={handleFileChange}
                accept=".xml"
              />
              <EuiSpacer size="m" />
              <EuiButton fill onClick={closeModal}>
                Close
              </EuiButton>
            </EuiModalBody>
          </EuiModal>
        </EuiOverlayMask>
      )}
    </EuiHeaderSection>

  );
};
