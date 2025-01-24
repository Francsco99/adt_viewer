import React, { useEffect, useState } from "react";
import {
  Chart,
  Settings,
  LineSeries,
  AreaSeries,
  Axis,
  Position,
  ScaleType,
} from "@elastic/charts";
import "@elastic/charts/dist/theme_light.css";
import { useTreeContext } from "./tree_context";

interface StateData {
  state_id: number;
  optimal_action: string | null;
}

interface NodeData {
  id: number;
  label: string;
  name: string;
  action?: string;
  cost?: number;
  time?: number;
  role?: string;
}

interface TreeData {
  nodes: NodeData[];
  edges: { id_source: number; id_target: number }[];
}

interface CostChartProps {
  states: StateData[];
  treeData: TreeData | null;
}

export const CostChart: React.FC<CostChartProps> = ({ states, treeData }) => {
  const { selectedState, defenderColor, attackerColor, totalColor } =
    useTreeContext();

  const [data, setData] = useState<{
    attackerColored: { x: number; y: number }[];
    attackerGray: { x: number; y: number }[];
    defenderColored: { x: number; y: number }[];
    defenderGray: { x: number; y: number }[];
    totalColored: { x: number; y: number }[];
    totalGray: { x: number; y: number }[];
  } | null>(null);

  // Weights for the objective function
  const wt = 1;
  const wc = 1;

  useEffect(() => {
    if (states && treeData) {
      const attackerData: { x: number; y: number }[] = [];
      const defenderData: { x: number; y: number }[] = [];
      const totalData: { x: number; y: number }[] = [];

      let cumulativeAttackerCost = 0;
      let cumulativeAttackerTime = 0;
      let cumulativeDefenderCost = 0;
      let cumulativeDefenderTime = 0;

      states.forEach((state) => {
        const optimalAction = state.optimal_action;
        const actionDetails = treeData.nodes.find(
          (node) => node.action === optimalAction
        );

        if (actionDetails) {
          if (actionDetails.role === "Attacker") {
            cumulativeAttackerCost += actionDetails.cost || 0;
            cumulativeAttackerTime += actionDetails.time || 0;
          } else if (actionDetails.role === "Defender") {
            cumulativeDefenderCost += actionDetails.cost || 0;
            cumulativeDefenderTime += actionDetails.time || 0;
          }
        }

        // Calculate the objective function
        const attackerObjective =
          wt * cumulativeAttackerTime + wc * cumulativeAttackerCost;
        const defenderObjective =
          wt * cumulativeDefenderTime + wc * cumulativeDefenderCost;
        const totalObjective = attackerObjective + defenderObjective;

        attackerData.push({ x: state.state_id, y: attackerObjective });
        defenderData.push({ x: state.state_id, y: defenderObjective });
        totalData.push({ x: state.state_id, y: totalObjective });
      });

      // Split data into colored and gray segments
      const splitData = (data: { x: number; y: number }[]) => ({
        colored: data.filter((point) => point.x <= selectedState),
        gray: data.filter((point) => point.x >= selectedState),
      });

      const attackerSplit = splitData(attackerData);
      const defenderSplit = splitData(defenderData);
      const totalSplit = splitData(totalData);

      // Add boundary points
      const addBoundary = (colored: any[], gray: any[]) => {
        if (gray.length > 0 && colored.length > 0) {
          gray.unshift(colored[colored.length - 1]);
        }
      };

      addBoundary(attackerSplit.colored, attackerSplit.gray);
      addBoundary(defenderSplit.colored, defenderSplit.gray);
      addBoundary(totalSplit.colored, totalSplit.gray);

      setData({
        attackerColored: attackerSplit.colored,
        attackerGray: attackerSplit.gray,
        defenderColored: defenderSplit.colored,
        defenderGray: defenderSplit.gray,
        totalColored: totalSplit.colored,
        totalGray: totalSplit.gray,
      });
    }
  }, [states, treeData, selectedState]);

  if (!data || !treeData) return <p>Loading chart...</p>;

  return (
    <div style={{ height: "400px" }}>
      <Chart>
        <Settings
          showLegend={true}
          legendPosition={Position.Top}
          tooltip={{
            customTooltip: ({ header, values }) => {
              // Filter values to exclude AreaSeries
              const filteredValues = values.filter(
                (value) =>
                  ![
                    "Attacker Colored Area",
                    "Attacker Gray Area",
                    "Defender Colored Area",
                    "Defender Gray Area",
                    "Total Colored Area",
                    "Total Gray Area",
                  ].includes(value.seriesIdentifier.specId)
              );

              return (
                <div
                  style={{
                    padding: "10px",
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>
                    {`State: ${header?.value}`}
                  </div>
                  <ul style={{ margin: 0, padding: "4px" }}>
                    {filteredValues.map((value, index) => (
                      <li key={index} style={{ color: value.color }}>
                        {value.seriesIdentifier.specId}:{" "}
                        <strong>{value.value}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            },
          }}
        />

        {/* Attacker */}
        <AreaSeries
          id="Attacker Gray Area"
          name="Attacker Future Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.attackerGray}
          color="rgba(128, 128, 128, 0.2)"
          hideInLegend
        />
        <AreaSeries
          id="Attacker Colored Area"
          name="Attacker Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.attackerColored}
          color={`${attackerColor}40`}
          hideInLegend
        />
        <LineSeries
          id="Attacker Line"
          name="Attacker Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.attackerColored}
          color={attackerColor}
        />

        {/* Defender */}
        <AreaSeries
          id="Defender Gray Area"
          name="Defender Future Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderGray}
          color="rgba(128, 128, 128, 0.2)"
          hideInLegend
        />
        <AreaSeries
          id="Defender Colored Area"
          name="Defender Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderColored}
          color={`${defenderColor}40`}
          hideInLegend
        />
        <LineSeries
          id="Defender Line"
          name="Defender Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderColored}
          color={defenderColor}
        />

        {/* Total Objective */}
        <AreaSeries
          id="Total Gray Area"
          name="Total Future Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.totalGray}
          color="rgba(128, 128, 128, 0.2)"
          hideInLegend
        />
        <AreaSeries
          id="Total Colored Area"
          name="Total Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.totalColored}
          color={`${totalColor}40`}
          hideInLegend
        />
        <LineSeries
          id="Total Line"
          name="Total Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.totalColored}
          color={totalColor}
        />

        {/* Axes */}
        <Axis id="bottom-axis" position={Position.Bottom} title="State" />
        <Axis
          id="left-axis"
          position={Position.Left}
          title="Objective Function Value"
        />
      </Chart>
    </div>
  );
};
