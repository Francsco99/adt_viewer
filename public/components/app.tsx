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
import { ActionsManager } from "./actions_manager";
import { CostChart } from "./cost_chart";
import { NodeInfo } from "./node_info";
import { PolicyComparisonChart } from "./policy_comparison_chart";
import { StatesVisualizer } from "./states_visualizer";
import { Toolbar } from "./toolbar";
import { TreeContextProvider } from "./tree_context";
import { TreeStateNavigator } from "./tree_states_navigator";

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
  const [policiesList, setPoliciesList] = useState<{ id: number; name: string }[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<{ id: number; name: string } | null>(null);
  const [treesList, setTreesList] = useState<{ id: number; name: string }[]>([]);
  const [selectedTree, setSelectedTree] = useState<{ id: number; name: string } | null>(null);
  const [isPolicyPopoverOpen, setIsPolicyPopoverOpen] = useState(false);
  const [isTreePopoverOpen, setIsTreePopoverOpen] = useState(false);
  const [listsLoaded, setListsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
  
    const fetchLists = async () => {
      try {
        // Carica le policy
        const policiesResponse = await http.get("/api/adt_viewer/policies_list");
        const mappedPolicies = policiesResponse.policies.map((policy: { id: number; name: string }) => ({
          id: policy.id,
          name: policy.name,
        }));
  
        // Carica gli alberi
        const treesResponse = await http.get("/api/adt_viewer/trees_list");
        const mappedTrees = treesResponse.trees.map((tree: { id: number; name: string }) => ({
          id: tree.id,
          name: tree.name,
        }));
  
        if (isMounted) {
          setPoliciesList(mappedPolicies);
          setTreesList(mappedTrees);
          setListsLoaded(true); // Segna il caricamento completato
        }
      } catch (error) {
        notifications.toasts.addDanger("Failed to load lists");
      }
    };
  
    fetchLists();
  
    return () => {
      isMounted = false; // Evita aggiornamenti dello stato se il componente viene smontato
    };
  }, [http, notifications]);
  
  // Effettua il set di defaultPolicy e defaultTree solo dopo che le liste sono state caricate
  useEffect(() => {
    if (listsLoaded) {
      if (!selectedPolicy && policiesList.length > 0) {
        const defaultPolicy = policiesList[0];
        setSelectedPolicy(defaultPolicy);
        loadPolicy(defaultPolicy.id);
      }
  
      if (!selectedTree && treesList.length > 0) {
        const defaultTree = treesList[0];
        setSelectedTree(defaultTree);
        loadTree(defaultTree.id);
      }
    }
  }, [listsLoaded, policiesList, treesList, selectedPolicy, selectedTree]);
  
  const loadPolicy = async (policyId: number) => {
    try {
      const res = await http.get(`/api/adt_viewer/load_policy/${policyId}`);
      setStates(res.states);
      setSelectedPolicy(policiesList.find((policy) => policy.id === policyId) || null);
      notifications.toasts.addSuccess(`Loaded policy with ID: ${policyId}`);
    } catch (error) {
      notifications.toasts.addDanger(`Failed to load policy with ID: ${policyId}`);
    }
  };
  
  const loadTree = async (treeId: number) => {
    try {
      const res = await http.get(`/api/adt_viewer/tree/${treeId}`);
      setTreeData(res.tree);
      setSelectedTree(treesList.find((tree) => tree.id === treeId) || null);
      notifications.toasts.addSuccess(`Loaded tree with ID: ${treeId}`);
    } catch (error) {
      notifications.toasts.addDanger(`Failed to load tree with ID: ${treeId}`);
    }
  };
  

  return (
    <Router basename={basename}>
      <TreeContextProvider selectedPolicy={selectedPolicy?.name ?? null} selectedTree={selectedTree?.name ?? null}>
        {/* Header */}
        <EuiHeader>
          <EuiHeaderSection grow={true}>
            <EuiHeaderSectionItem>
              <Toolbar
                http={http}
                notifications={notifications}
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
                          name: policy.name,
                          onClick: () => {
                            setIsPolicyPopoverOpen(false);
                            setSelectedPolicy(policy);
                            loadPolicy(policy.id);
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
                    {selectedPolicy?.name ?? "No policy selected"}
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
                          name: tree.name,
                          onClick: () => {
                            setIsTreePopoverOpen(false);
                            setSelectedTree(tree);
                            loadTree(tree.id);
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
                    {selectedTree?.name ?? "No tree selected"}
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
                    <TreeStateNavigator treeData={treeData} states={states} />
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
                              treeData={treeData}
                              states={states}
                            />
                          </div>
                        ),
                      },
                      {
                        id: "ActionsManagerTab",
                        name: "Actions Manager",
                        content: (
                          <div style={{ padding: "16px" }}>
                            <ActionsManager treeData={treeData} http={http} notifications={notifications} />
                          </div>
                        ),
                      },
                    ]}
                    initialSelectedTab={{
                      id: "nodeInfoTab",
                      name: "Node Info",
                      content: (
                        <div style={{ padding: "16px" }}>
                          <NodeInfo treeData={treeData} />
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
              <EuiFlexItem grow={3}>
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
                            <CostChart states={states} treeData={treeData} />
                          </div>
                        ),
                      },
                      {
                        id: "PolicyComparisonChart",
                        name: "Policy Comparison",
                        content: (
                          <div>
                            {/*<PolicyComparisonChart
                              http={http}
                              notifications={notifications}
                              policiesList={policiesList}
                              treeData={treeData}
                            />*/}
                          </div>
                        ),
                      },
                    ]}
                    initialSelectedTab={{
                      id: "CostChartTab",
                      name: "Cost Chart",
                      content: (
                        <div style={{ padding: "16px" }}>
                          <CostChart states={states} treeData={treeData} />
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
