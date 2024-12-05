import React, { useState, useEffect } from "react";
//import { i18n } from '@osd/i18n';
import { BrowserRouter as Router } from "react-router-dom";

import {
  EuiPage,
  EuiPageBody,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiHeader,
  EuiTabbedContent,
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

  useEffect(() => {
    // Carica i dati dell'albero
    http
      .get("/api/adt_viewer/tree")
      .then((res) => setTreeData(res.tree))
      .catch((error) =>
        notifications.toasts.addDanger("Failed to load tree data")
      );

    // Carica gli stati dell'albero
    http
      .get("/api/adt_viewer/policy")
      .then((res) => setStates(res.states))
      .catch((error) =>
        notifications.toasts.addDanger("Failed to load tree states")
      );

    // Carica actions.json
    http
      .get("/api/adt_viewer/actions")
      .then((actionsRes) => setActions(actionsRes))
      .catch((error) =>
        notifications.toasts.addDanger("Failed to load actions data")
      );
  }, [http, notifications]);

  return (
    <Router basename={basename}>
      <TreeContextProvider>
        {/* Header */}
        <EuiHeader>
          <Toolbar
            currentStateIndex={currentStateIndex}
            setCurrentStateIndex={setCurrentStateIndex}
            states={states}
          />
        </EuiHeader>
        {/* Pagina principale */}
        <EuiPage paddingSize="m" grow>
          <EuiPageBody>
            {/* Prima riga */}
            <EuiFlexGroup gutterSize="m">
              {/* Prima colonna: Grafico dell'albero */}
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

              {/* Seconda colonna: Schede (Node Info e Policy Manager) */}
              <EuiFlexItem grow={1}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Actions and Policy Manager</h2>
                  </EuiTitle>
                  <EuiTabbedContent
                    tabs={[
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
                        id: "policyManagerTab",
                        name: "Policy Manager",
                        content: (
                          <div style={{ padding: "16px" }}>
                            <PolicyManager
                              policies={states}
                              actions={actions}
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

              {/* Terza colonna: Cost Chart */}
              <EuiFlexItem grow={1}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Cost Chart</h2>
                  </EuiTitle>
                  <CostChart states={states} actions={actions} />
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>

            {/* Spazio tra le righe */}
            <div style={{ margin: "8px 0" }}></div>

            {/* Seconda riga */}
            <EuiFlexGroup gutterSize="m">
              {/* Placeholder prima colonna */}
              <EuiFlexItem grow={1}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Node Info</h2>
                  </EuiTitle>
                  <NodeInfo http={http} notifications={notifications} />
                </EuiPanel>
              </EuiFlexItem>

              {/* Placeholder seconda colonna */}
              <EuiFlexItem grow={1}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Policy Editor</h2>
                  </EuiTitle>
                  <PolicyEditor policies={states} actions={actions}/>
                </EuiPanel>
              </EuiFlexItem>

              {/* Placeholder terza colonna */}
              <EuiFlexItem grow={1}>
                <EuiPanel>
                  <EuiTitle size="m">
                    <h2>Placeholder 3</h2>
                  </EuiTitle>
                  <p>Content for placeholder 3</p>
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageBody>
        </EuiPage>
      </TreeContextProvider>
    </Router>
  );
};
