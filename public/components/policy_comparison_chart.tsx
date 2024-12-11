import React, { useEffect, useState } from "react";
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiSelectable,
  EuiIcon,
} from "@elastic/eui";
import { Chart, Settings, Axis, BarSeries, ScaleType, Position } from "@elastic/charts";
import "@elastic/charts/dist/theme_only_light.css";

interface PolicyComparisonChartProps {
  http: any;
  notifications: any;
  policiesList: string[];
  actions: { id: number; cost: number; time: number }[];
}

export const PolicyComparisonChart: React.FC<PolicyComparisonChartProps> = ({
  http,
  notifications,
  policiesList,
  actions,
}) => {
  const [policyMetrics, setPolicyMetrics] = useState<
    { policy: string; cost: number; time: number; objective: number }[]
  >([]);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>(policiesList);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Options for EuiSelectable (allow "on" and undefined)
  const [options, setOptions] = useState<
    { label: string; checked?: "on" }[]
  >(
    policiesList.map((policy) => ({
      label: policy,
      checked: "on", // Default to "on"
    }))
  );

  // Weights for the objective function
  const wt = 0.5;
  const wc = 0.5;

  useEffect(() => {
    const fetchPolicyData = async () => {
      try {
        const metrics = await Promise.all(
          policiesList.map(async (policyName) => {
            const response = await http.get(`/api/adt_viewer/load_policy/${policyName}`);
            const policy = response;

            let totalCost = 0;
            let totalTime = 0;

            policy.states.forEach((state: any) => {
              state.actions_id.forEach((actionId: number) => {
                const action = actions.find((act) => act.id === actionId);
                if (action) {
                  totalCost += action.cost;
                  totalTime += action.time;
                }
              });
            });

            const objective = wt * totalTime + wc * totalCost;
            return { policy: policyName, cost: totalCost, time: totalTime, objective };
          })
        );

        setPolicyMetrics(metrics);

        // Initialize options after data is loaded
        setOptions(
          policiesList.map((policy) => ({
            label: policy,
            checked: selectedPolicies.includes(policy) ? "on" : undefined,
          }))
        );
      } catch (error) {
        notifications.toasts.addDanger("Failed to load policy data for comparison");
      }
    };

    fetchPolicyData();
  }, [http, policiesList, actions, notifications, selectedPolicies]);

  const handleSelectionChange = (updatedOptions: { label: string; checked?: "on" }[]) => {
    setOptions(updatedOptions);
    const selected = updatedOptions.filter((option) => option.checked === "on").map((o) => o.label);
    setSelectedPolicies(selected);
  };

  const filteredMetrics = policyMetrics.filter((metric) =>
    selectedPolicies.includes(metric.policy)
  );

  return (
      <EuiFlexGroup alignItems="flexStart" gutterSize="m">
        {/* Chart */}
        <EuiFlexItem>
          {filteredMetrics.length > 0 ? (
            <Chart size={{ height: 400 }}>
              <Settings showLegend={false} />
              <Axis id="bottom-axis" position={Position.Bottom} title="Policy Name" showGridLines />
              <Axis id="left-axis" position={Position.Left} title="Objective Function Value" showGridLines />
              <BarSeries
                id="Objective"
                name="Objective Function"
                xScaleType={ScaleType.Ordinal}
                yScaleType={ScaleType.Linear}
                xAccessor="policy"
                yAccessors={["objective"]}
                data={filteredMetrics}
              />
            </Chart>
          ) : (
            <p>No policies selected for display.</p>
          )}
        </EuiFlexItem>

        {/* Icon to open the selectable menu */}
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
