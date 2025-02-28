import React, { useEffect, useState } from "react";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiSelectable,
  EuiIcon,
} from "@elastic/eui";
import {
  Chart,
  Settings,
  Axis,
  LineSeries,
  ScaleType,
  Position,
} from "@elastic/charts";
import "@elastic/charts/dist/theme_only_light.css";
import { useTreeContext } from "./tree_context";

interface PolicyData {
  policyId: number; // Policy ID
  policy: string; // Policy name
  cost: number; // Total monetary cost
  time: number; // Total time
  objective: number; // Objective function value
}

interface PolicyComparisonChartProps {
  http: any; // HTTP service for API calls
  notifications: any; // Notifications service for user feedback
  policiesList: { id: number; name: string }[]; // List of policies to compare
  treeData: {
    nodes: {
      id: number;
      label: string;
      action?: string;
      cost?: number;
      time?: number;
      role?: string;
    }[];
    edges: { id_source: number; id_target: number }[];
  } | null; // Tree data containing nodes and edges
}

export const PolicyComparisonChart: React.FC<PolicyComparisonChartProps> = ({
  http,
  notifications,
  policiesList,
  treeData,
}) => {
  const { getColor } = useTreeContext(); // Get color palette from context
  const [policyMetrics, setPolicyMetrics] = useState<PolicyData[]>([]); // Metrics for each policy
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<number[]>(
    policiesList.map((policy) => policy.id)
  ); // Selected policy IDs for display
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); // Toggle for the policy selection popover

  // Options for the policy selector
  const [options, setOptions] = useState<{ label: string; policyId: number; checked?: "on" }[]>(
    policiesList.map((policy) => ({
      label: policy.name,
      policyId: policy.id,
      checked: "on",
    }))
  );

  const wt = 1; // Weight for time in the objective function
  const wc = 1; // Weight for cost in the objective function

  useEffect(() => {
    const fetchPolicyData = async () => {
      if (!treeData) {
        notifications.toasts.addDanger("Tree data is not available.");
        return;
      }

      try {
        // Fetch metrics for each policy
        const metrics = await Promise.all(
          policiesList.map(async (policy) => {
            const response = await http.get(`/api/adt_viewer/load_policy/${policy.id}`);
            const policyData = response;

            let totalCost = 0;
            let totalTime = 0;

            // Calculate total cost and time using `optimal_action` and `treeData`
            policyData.states.forEach((state: any) => {
              const optimalActionLabel = state.optimal_action;
              if (optimalActionLabel) {
                const actionNode = treeData.nodes.find(
                  (node) => node.action === optimalActionLabel
                );
                if (
                  actionNode &&
                  actionNode.cost !== undefined &&
                  actionNode.time !== undefined
                ) {
                  totalCost += actionNode.cost;
                  totalTime += actionNode.time;
                }
              }
            });

            // Calculate the objective function value
            const objective = wt * totalTime + wc * totalCost;
            return {
              policyId: policy.id,
              policy: policy.name,
              cost: totalCost,
              time: totalTime,
              objective,
            };
          })
        );

        setPolicyMetrics(metrics);

        // Update options for the policy selector
        setOptions(
          policiesList.map((policy) => ({
            label: policy.name,
            policyId: policy.id,
            checked: selectedPolicyIds.includes(policy.id) ? "on" : undefined,
          }))
        );
      } catch (error) {
        notifications.toasts.addDanger("Failed to load policy data for comparison.");
      }
    };

    fetchPolicyData();
  }, [http, policiesList, treeData, notifications, selectedPolicyIds]);

  // Handle selection change in the policy selector
  const handleSelectionChange = (
    updatedOptions: { label: string; policyId: number; checked?: "on" }[]
  ) => {
    setOptions(updatedOptions);
    const selectedIds = updatedOptions
      .filter((option) => option.checked === "on")
      .map((o) => o.policyId);
    setSelectedPolicyIds(selectedIds);
  };

  // Filter metrics to include only selected policies
  const filteredMetrics = policyMetrics.filter((metric) =>
    selectedPolicyIds.includes(metric.policyId)
  );

  return (
    <EuiFlexGroup alignItems="flexStart" gutterSize="m">
      <EuiFlexItem>
        {filteredMetrics.length > 0 ? (
          <Chart size={{ height: 400 }}>
            <Settings
              showLegend={false} // Disable legend
              tooltip={{
                customTooltip: ({ values }) => (
                  <div style={{ padding: "10px", backgroundColor: "#fff", border: "1px solid #ccc" }}>
                    {values.map((val, idx) => {
                      const datum = val.datum as Partial<PolicyData>;
                      if (!datum || !datum.policy || datum.objective === undefined) {
                        return null;
                      }

                      return (
                        <div key={idx}>
                          <strong>Policy:</strong> {datum.policy}
                          <br />
                          <strong>Time:</strong> {datum.time ?? "N/A"}
                          <br />
                          <strong>Monetary Cost:</strong> {datum.cost ?? "N/A"}
                          <br />
                          <strong>Objective:</strong> {datum.objective.toFixed(2)}
                        </div>
                      );
                    })}
                  </div>
                ),
              }}
            />

            {filteredMetrics.map((metric, index) => (
              <LineSeries
                key={metric.policyId}
                id={metric.policy}
                name={metric.policy}
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                xAccessor="x"
                yAccessors={["y"]}
                lineSeriesStyle={{
                  line: {
                    strokeWidth: 2,
                    stroke: getColor(index),
                  },
                }}
                pointStyleAccessor={(datum) => {
                  if (datum.x === 0) {
                    return { radius: 0 };
                  }
                  return {
                    visible: true,
                    radius: 3,
                    strokeWidth: 6,
                    stroke: getColor(index),
                  };
                }}
                data={[
                  { x: 0, y: 0, policy: metric.policy },
                  { x: metric.time, y: metric.cost, ...metric },
                ]}
              />
            ))}

            <Axis 
            id="bottom-axis" 
            position={Position.Bottom} 
            title="Time" showGridLines
            style={{
              tickLabel: {
                fontSize: 20, // Aumenta la dimensione delle etichette numeriche sugli assi
              },
              axisTitle: {
                fontSize: 20, // Aumenta la dimensione del titolo dell'asse
              },
            }}
            />
            <Axis 
            id="left-axis" 
            position={Position.Left} 
            title="Monetary Cost" showGridLines 
            style={{
              tickLabel: {
                fontSize: 20, // Aumenta la dimensione delle etichette numeriche sugli assi
              },
              axisTitle: {
                fontSize: 20, // Aumenta la dimensione del titolo dell'asse
              },
            }}
            />
          </Chart>
        ) : (
          <p>No policies selected for display.</p>
        )}
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiPopover
          button={
            <EuiIcon
              type="list"
              size="l"
              onClick={() => setIsPopoverOpen((isOpen) => !isOpen)}
              aria-label="Select policies"
              style={{ cursor: "pointer" }}
            />
          }
          isOpen={isPopoverOpen}
          closePopover={() => setIsPopoverOpen(false)}
        >
          <EuiSelectable
            options={options}
            onChange={handleSelectionChange}
            searchable
            height={300}
          >
            {(list, search) => (
              <>
                {search}
                {list}
              </>
            )}
          </EuiSelectable>
        </EuiPopover>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
