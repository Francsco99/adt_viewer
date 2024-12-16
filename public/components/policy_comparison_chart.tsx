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

interface PolicyData {
  policy: string;
  cost: number;
  time: number;
  objective: number;
}

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
  const [policyMetrics, setPolicyMetrics] = useState<PolicyData[]>([]);
  const [selectedPolicies, setSelectedPolicies] =
    useState<string[]>(policiesList);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [options, setOptions] = useState<{ label: string; checked?: "on" }[]>(
    policiesList.map((policy) => ({
      label: policy,
      checked: "on",
    }))
  );

  const wt = 0.5;
  const wc = 0.5;

  useEffect(() => {
    const fetchPolicyData = async () => {
      try {
        const metrics = await Promise.all(
          policiesList.map(async (policyName) => {
            const response = await http.get(
              `/api/adt_viewer/load_policy/${policyName}`
            );
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
            return {
              policy: policyName,
              cost: totalCost,
              time: totalTime,
              objective,
            };
          })
        );

        setPolicyMetrics(metrics);

        setOptions(
          policiesList.map((policy) => ({
            label: policy,
            checked: selectedPolicies.includes(policy) ? "on" : undefined,
          }))
        );
      } catch (error) {
        notifications.toasts.addDanger(
          "Failed to load policy data for comparison"
        );
      }
    };

    fetchPolicyData();
  }, [http, policiesList, actions, notifications, selectedPolicies]);

  const handleSelectionChange = (
    updatedOptions: { label: string; checked?: "on" }[]
  ) => {
    setOptions(updatedOptions);
    const selected = updatedOptions
      .filter((option) => option.checked === "on")
      .map((o) => o.label);
    setSelectedPolicies(selected);
  };

  const filteredMetrics = policyMetrics.filter((metric) =>
    selectedPolicies.includes(metric.policy)
  );

  return (
    <EuiFlexGroup alignItems="flexStart" gutterSize="m">
      <EuiFlexItem>
        {filteredMetrics.length > 0 ? (
          <Chart size={{ height: 400 }}>
            <Settings
              showLegend={false}
              tooltip={{
                customTooltip: ({ values }) => (
                  <div
                    style={{
                      padding: "10px",
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                    }}
                  >
                    {values.map((val, idx) => {
                      // Cast al tipo PolicyData con controlli extra
                      const datum = val.datum as Partial<PolicyData>;
                      if (
                        !datum ||
                        !datum.policy ||
                        datum.objective === undefined
                      ) {
                        return null; // Ignora dati incompleti o invalidi
                      }

                      return (
                        <div key={idx}>
                          <strong>Policy:</strong> {datum.policy}
                          <br />
                          <strong>Time:</strong> {datum.time ?? "N/A"}
                          <br />
                          <strong>Monetary Cost:</strong> {datum.cost ?? "N/A"}
                          <br />
                          <strong>Objective:</strong>{" "}
                          {datum.objective.toFixed(2)}
                        </div>
                      );
                    })}
                  </div>
                ),
              }}
            />

            {/* Render a LineSeries for each policy */}
            {filteredMetrics.map((metric) => (
              <LineSeries
                key={metric.policy}
                id={metric.policy}
                name={metric.policy}
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                xAccessor="x"
                yAccessors={["y"]}
                lineSeriesStyle={{
                  line: {
                    strokeWidth: 2, // Aumenta lo spessore della linea
                  },
                }}
                pointStyleAccessor={(datum) => {
                  // Controlla se il punto è (0, 0) e nascondilo
                  if (datum.x === 0) {
                    return {
                      radius: 0,
                    };
                  }
                  return {
                    visible: true, // Mostra gli altri punti
                    radius: 3,
                    strokeWidth: 6,
                  };
                }}
                data={[
                  { x: 0, y: 0, policy: metric.policy }, // Origine (dati neutri)
                  { x: metric.time, y: metric.cost, ...metric }, // Punto finale (dati completi)
                ]}
              />
            ))}

            <Axis
              id="bottom-axis"
              position={Position.Bottom}
              title="Time"
              showGridLines
            />
            <Axis
              id="left-axis"
              position={Position.Left}
              title="Monetary Cost"
              showGridLines
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
