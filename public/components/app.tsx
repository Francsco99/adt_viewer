import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import {
  EuiPage,
  EuiPageBody,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiButtonIcon,
  EuiText,
  EuiPopover,
  EuiContextMenu,
  EuiTabbedContent,
  EuiToolTip,
} from "@elastic/eui";

import { CoreStart } from "../../../../src/core/public";
import { NavigationPublicPluginStart } from "../../../../src/plugins/navigation/public";
import { TreeContextProvider } from "./tree_context";
import { NodeInfo } from "./node_info";
import { TreeStateNavigator } from "./tree_states_navigator";
import { ActionsManager } from "./actions_manager";
import { Toolbar } from "./toolbar";
import { CostChart } from "./cost_chart";
import { PolicyManager } from "./policy_manager";
import { PolicyEditor } from "./policy_editor";
import { ProgressiveTreeVisualizer } from "./progressive_tree_visualizer";
import { PolicyComparisonChart } from "./policy_comparison_chart";

interface AdtViewerAppDeps {
  basename: string;
  notifications: CoreStart["notifications"];
  http: CoreStart["http"];
  navigation: NavigationPublicPluginStart;
}

export const AdtViewerApp = ({
  basename,
  notifications,
  http,
  navigation,
}: AdtViewerAppDeps) => {
  const [treeData, setTreeData] = useState(null);
  const [states, setStates] = useState([]);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [actions, setActions] = useState([]);
  const [policiesList, setPoliciesList] = useState<string[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    // Carica i dati dell'albero
    http
      .get("/api/adt_viewer/tree")
      .then((res) => setTreeData(res.tree))
      .catch((error) =>
        notifications.toasts.addDanger("Failed to load tree data")
      );

    // Carica actions.json
    http
      .get("/api/adt_viewer/actions")
      .then((actionsRes) => setActions(actionsRes))
      .catch((error) =>
        notifications.toasts.addDanger("Failed to load actions data")
      );

    http
      .get("/api/adt_viewer/policies_list")
      .then((res) => setPoliciesList(res.policies))
      .catch((error) =>
        notifications.toasts.addDanger("Failed to load policies list")
      );
  }, [http, notifications]);

  const loadPolicy = (policyName: string) => {
    http
      .get(`/api/adt_viewer/load_policy/${policyName}`)
      .then((res) => {
        setStates(res.states); // Aggiorna gli stati con i dati della policy selezionata
        setSelectedPolicy(policyName); // Aggiorna la policy selezionata
        setIsEditable(res.editable); // Imposta il valore di 'editable'
        notifications.toasts.addSuccess(`Loaded policy: ${policyName}`);
      })
      .catch((error) => {
        notifications.toasts.addDanger(`Failed to load policy: ${policyName}`);
      });
  };

  return (
    <Router basename={basename}>
      <TreeContextProvider>
        {/* Header */}
        <EuiHeader>
          <EuiHeaderSection grow={true}>
            <EuiHeaderSectionItem>
              <Toolbar
                currentStateIndex={currentStateIndex}
                setCurrentStateIndex={setCurrentStateIndex}
                states={states}
              />
            </EuiHeaderSectionItem>
          </EuiHeaderSection>
          <EuiHeaderSection grow={false}>
            {/* Selettore delle Policy */}
            <EuiFlexGroup
              alignItems="center"
              justifyContent="spaceBetween"
              gutterSize="m"
            >
              <EuiFlexItem grow={false}>
                <EuiText>
                  <span style={{ fontWeight: "bold" }}>
                    {selectedPolicy ? selectedPolicy : "No policy selected"}
                  </span>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiPopover
                  button={
                    <EuiToolTip position="bottom" content={"Choose policy"}>
                    <EuiButtonIcon
                      iconType="list"
                      size="m"
                      onClick={() => setIsPopoverOpen((prev) => !prev)}
                      aria-label="Show Policies"
                    />
                    </EuiToolTip>
                  }
                  isOpen={isPopoverOpen}
                  closePopover={() => setIsPopoverOpen(false)}
                >
                  <EuiContextMenu
                    size="s"
                    initialPanelId={0}
                    panels={[
                      {
                        id: 0,
                        items: policiesList.map((policy) => ({
                          name: policy,
                          onClick: () => {
                            setIsPopoverOpen(false);
                            setSelectedPolicy(policy);
                            console.log(`Selected policy: ${policy}`);
                            loadPolicy(policy);
                          },
                        })),
                      },
                    ]}
                  />
                </EuiPopover>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiHeaderSection>
        </EuiHeader>

        {/* Pagina principale */}
        <EuiPage paddingSize="m" grow>
          <EuiPageBody>
            {/* Prima riga */}
            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem grow={1}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Attack Tree</h2>
                  </EuiTitle>
                  {treeData ? (
                    <TreeStateNavigator treeData={treeData} states={states} />
                  ) : (
                    <p>Loading tree data...</p>
                  )}
                </EuiPanel>
              </EuiFlexItem>

              <EuiFlexItem grow={1}>
              <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Tree Manager</h2>
                  </EuiTitle>
                  <EuiTabbedContent
                    tabs={[
                      {
                        id: "nodeInfoTab",
                        name: "Node Info",
                        content:(
                          <div style={{padding: "16px"}}>
                            <NodeInfo treeData={treeData}/>
                          </div>
                        )
                      },
                      {
                        id: "actionsManagerTab",
                        name: "Actions Manager",
                        content: (
                          <div style={{ padding: "16px" }}>
                            <ActionsManager states={states} actions={actions} />
                          </div>
                        ),
                      },
                      
                    ]}
                    initialSelectedTab={{
                      id: "nodeInfoTab",
                      name: "Node Info",
                      content: (
                        <div style={{ padding: "16px" }}>
                          <NodeInfo treeData={treeData}/>
                        </div>
                      ),
                    }}
                    autoFocus="selected"
                    size="m"
                  />
                </EuiPanel>
              </EuiFlexItem>

              <EuiFlexItem grow={1}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Cost Chart</h2>
                  </EuiTitle>
                  <CostChart states={states} actions={actions} />
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>

            <div style={{ margin: "8px 0" }}></div>

            {/* Seconda riga */}
            <EuiFlexGroup gutterSize="m">

            <EuiFlexItem grow={1}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Placeholder</h2>
                  </EuiTitle>
                    
                </EuiPanel>
              </EuiFlexItem>

              <EuiFlexItem grow={2}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Policy Editor</h2>
                  </EuiTitle>
                  <EuiTabbedContent
                    tabs={[
                      {
                      id: "policyEditorTab",
                      name:"Policy Editor",
                      content:(
                        <div style={{padding:"16px"}}>
                          <PolicyEditor
                            notifications={notifications}
                            selectedPolicy={selectedPolicy || "missing_name.json"}
                            http={http}
                            states={states}
                            actions={actions}
                            editable={isEditable}
                          />
                        </div>
                      ),
                    },
                    {
                      id: "policyMangerTab",
                      name:"Policy Manager",
                      content:(
                        <div style={{padding: "16px"}}>
                          <PolicyManager policies={states} actions={actions}/>
                        </div>
                      )
                    },
                    ]}
                    initialSelectedTab={{
                      id: "policyEditorTab",
                      name:"Policy Editor",
                      content:(
                        <div style={{padding:"16px"}}>
                          <PolicyEditor
                            notifications={notifications}
                            selectedPolicy={selectedPolicy || "missing_name.json"}
                            http={http}
                            states={states}
                            actions={actions}
                            editable={isEditable}
                          />
                        </div>
                      ),
                    }}
                  />
                  
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageBody>
        </EuiPage>
      </TreeContextProvider>
    </Router>
  );
};
