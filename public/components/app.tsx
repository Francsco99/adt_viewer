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
  EuiIcon,
} from "@elastic/eui";

import { CoreStart } from "../../../../src/core/public";
import { NavigationPublicPluginStart } from "../../../../src/plugins/navigation/public";
import { TreeContextProvider } from "./tree_context";
import { NodeInfo } from "./node_info";
import { TreeStateNavigator } from "./tree_states_navigator";
import { ActionsManager } from "./actions_manager";
import { Toolbar } from "./toolbar";
import { CostChart } from "./cost_chart";
import { StatesVisualizer } from "./states_visualizer";
import { PolicyComparisonChart } from "./policy_comparison_chart";
import { ActionTable } from "./actions_table";

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
  const [treesList, setTreesList] = useState<string[]>([]);
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [isPolicyPopoverOpen, setIsPolicyPopoverOpen] = useState(false);
  const [isTreePopoverOpen, setIsTreePopoverOpen] = useState(false);

  useEffect(() => {
    // Carica la lista delle policy
    http
      .get("/api/adt_viewer/policies_list")
      .then((res) => {
        setPoliciesList(res.policies);
        if (res.policies.includes("policy.json")) {
          setSelectedPolicy("policy.json");
          loadPolicy("policy.json");
        }
      })
      .catch((error) =>
        notifications.toasts.addDanger("Failed to load policies list")
      );

    // Carica la lista degli alberi
    http
      .get("/api/adt_viewer/trees_list")
      .then((res) => {
        setTreesList(res.trees);
        if (res.trees.length > 0) {
          setSelectedTree(res.trees[0]); // Seleziona il primo albero di default
          loadTree(res.trees[0]);
        }
      })
      .catch((error) =>
        notifications.toasts.addDanger("Failed to load trees list")
      );
  }, [http, notifications]);

  const loadPolicy = (policyName: string) => {
    http
      .get(`/api/adt_viewer/load_policy/${policyName}`)
      .then((res) => {
        setStates(res.states);
        setSelectedPolicy(policyName);
        notifications.toasts.addSuccess(`Loaded policy: ${policyName}`);
      })
      .catch((error) =>
        notifications.toasts.addDanger(`Failed to load policy: ${policyName}`)
      );
  };

  const loadTree = (treeName: string) => {
    http
      .get(`/api/adt_viewer/tree/${treeName}`)
      .then((res) => {
        setTreeData(res.tree);
        setSelectedTree(treeName);
        notifications.toasts.addSuccess(`Loaded tree: ${treeName}`);
      })
      .catch((error) =>
        notifications.toasts.addDanger(`Failed to load tree: ${treeName}`)
      );
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
              gutterSize="xs"
            >
              <EuiFlexItem grow={false}>
                <EuiPopover
                  button={
                    <EuiToolTip position="bottom" content={"Choose policy"}>
                      <EuiButtonIcon
                        iconType="list"
                        size="m"
                        onClick={() => setIsPolicyPopoverOpen((prev) => !prev)}
                        aria-label="Show Policies"
                      />
                    </EuiToolTip>
                  }
                  isOpen={isPolicyPopoverOpen}
                  closePopover={() => setIsPolicyPopoverOpen(false)}
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
                            setIsPolicyPopoverOpen(false);
                            setSelectedPolicy(policy);
                            loadPolicy(policy);
                          },
                        })),
                      },
                    ]}
                  />
                </EuiPopover>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText>
                  <span style={{ fontWeight: "bold" }}>
                    {selectedPolicy ? selectedPolicy : "No policy selected"}
                  </span>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiHeaderSection>

          <EuiHeaderSection>
            <EuiIcon type="empty"></EuiIcon>
          </EuiHeaderSection>

          <EuiHeaderSection grow={false}>
            {/* Selettore degli Alberi */}
            <EuiFlexGroup
              alignItems="center"
              gutterSize="xs"
            >
              
              <EuiFlexItem grow={false}>
                <EuiPopover
                  button={
                    <EuiToolTip position="bottom" content={"Choose tree"}>
                      <EuiButtonIcon
                        iconType="list"
                        size="m"
                        onClick={() => setIsTreePopoverOpen((prev) => !prev)}
                        aria-label="Show Trees"
                      />
                    </EuiToolTip>
                  }
                  isOpen={isTreePopoverOpen}
                  closePopover={() => setIsTreePopoverOpen(false)}
                >
                  <EuiContextMenu
                    size="s"
                    initialPanelId={0}
                    panels={[
                      {
                        id: 0,
                        items: treesList.map((tree) => ({
                          name: tree,
                          onClick: () => {
                            setIsTreePopoverOpen(false);
                            setSelectedTree(tree);
                            loadTree(tree);
                          },
                        })),
                      },
                    ]}
                  />
                </EuiPopover>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText>
                  <span style={{ fontWeight: "bold" }}>
                    {selectedTree ? selectedTree : "No tree selected"}
                  </span>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiHeaderSection>

          <EuiHeaderSection>
            <EuiIcon type="empty"></EuiIcon>
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

              <EuiFlexItem grow={2}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Tree Manager</h2>
                  </EuiTitle>
                  <EuiTabbedContent
                    tabs={[
                      {
                        id: "nodeInfoTab",
                        name: "Node Info",
                        content: (
                          <div style={{ padding: "16px" }}>
                            <NodeInfo treeData={treeData} />
                          </div>
                        ),
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
                      {
                        id: "StatesVisualizerTab",
                        name: "States Visualizer",
                        content: (
                          <div
                            style={{
                              padding: "16px",
                              maxHeight: "350px", // Fixed height for the content
                              overflowY: "auto", // Enable vertical scrolling for content
                            }}
                          >
                            <StatesVisualizer
                              actions={actions}
                              states={states}
                            />
                          </div>
                        ),
                      },
                    ]}
                    initialSelectedTab={{
                      id: "actionsManagerTab",
                      name: "Actions Manager",
                      content: (
                        <div style={{ padding: "16px" }}>
                          <ActionsManager states={states} actions={actions} />
                        </div>
                      ),
                    }}
                    autoFocus="selected"
                    size="m"
                  />
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>

            <div style={{ margin: "8px 0" }}></div>

            {/* Seconda riga */}
            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem grow={1}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Policy manager</h2>
                  </EuiTitle>
                  <ActionTable
                    actions={actions}
                    states={states}
                    http={http}
                    notifications={notifications}
                  />
                </EuiPanel>
              </EuiFlexItem>

              <EuiFlexItem grow={2}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Charts</h2>
                  </EuiTitle>
                  <EuiTabbedContent
                    tabs={[
                      {
                        id: "CostChartTab",
                        name: "Cost Chart",
                        content: (
                          <div style={{ padding: "16px" }}>
                            <CostChart states={states} actions={actions} />
                          </div>
                        ),
                      },
                      {
                        id: "PolicyComparisonChart",
                        name: "Policy Comparison",
                        content: (
                          <div>
                            <PolicyComparisonChart
                              http={http}
                              notifications={notifications}
                              policiesList={policiesList}
                              actions={actions}
                            />
                          </div>
                        ),
                      },
                    ]}
                    initialSelectedTab={{
                      id: "CostChartTab",
                      name: "Cost Chart",
                      content: (
                        <div style={{ padding: "16px" }}>
                          <CostChart states={states} actions={actions} />
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
