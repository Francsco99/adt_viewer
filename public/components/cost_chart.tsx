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
  actions_id: number[];
}

interface ActionData {
  id: number;
  agent: string;
  action: string;
  cost: number;
  time: number;
}

interface CostChartProps {
  states: StateData[];
  actions: ActionData[];
}

export const CostChart: React.FC<CostChartProps> = ({ states, actions }) => {
  const { selectedState, defenderColor, attackerColor } = useTreeContext(); // Get the selected state from context
  const [data, setData] = useState<{
    attackerColored: { x: number; y: number }[];
    attackerGray: { x: number; y: number }[];
    defenderColored: { x: number; y: number }[];
    defenderGray: { x: number; y: number }[];
  } | null>(null);

  // Weights for the objective function
  const wt = 0.5; // Weight for time
  const wc = 0.5; // Weight for cost

  useEffect(() => {
    if (states && actions) {
      const attackerData: { x: number; y: number }[] = [];
      const defenderData: { x: number; y: number }[] = [];

      let cumulativeAttackerCost = 0;
      let cumulativeAttackerTime = 0;
      let cumulativeDefenderCost = 0;
      let cumulativeDefenderTime = 0;

      // Calculate cumulative costs and times
      states.forEach((state) => {
        const stateActions = actions.filter((action) =>
          state.actions_id.includes(action.id)
        );

        // Calculate cumulative costs and times for the attacker
        const attackerCost = stateActions
          .filter((action) => action.agent === "attacker")
          .reduce((sum, action) => sum + action.cost, 0);

        const attackerTime = stateActions
          .filter((action) => action.agent === "attacker")
          .reduce((sum, action) => sum + action.time, 0);

        // Calculate cumulative costs and times for the defender
        const defenderCost = stateActions
          .filter((action) => action.agent === "defender")
          .reduce((sum, action) => sum + action.cost, 0);

        const defenderTime = stateActions
          .filter((action) => action.agent === "defender")
          .reduce((sum, action) => sum + action.time, 0);

        // Update cumulative values
        cumulativeAttackerCost += attackerCost;
        cumulativeAttackerTime += attackerTime;
        cumulativeDefenderCost += defenderCost;
        cumulativeDefenderTime += defenderTime;

        // Compute the objective function
        const attackerObjective =
          wt * cumulativeAttackerTime + wc * cumulativeAttackerCost;
        const defenderObjective =
          wt * cumulativeDefenderTime + wc * cumulativeDefenderCost;

        // Push data for the chart
        attackerData.push({ x: state.state_id, y: attackerObjective });
        defenderData.push({ x: state.state_id, y: defenderObjective });
      });

      // Split data into colored and gray segments
      const attackerColored = attackerData.filter(
        (point) => point.x <= selectedState
      );
      const attackerGray = attackerData.filter(
        (point) => point.x >= selectedState
      );
      const defenderColored = defenderData.filter(
        (point) => point.x <= selectedState
      );
      const defenderGray = defenderData.filter(
        (point) => point.x >= selectedState
      );

      // Add boundary points for continuity
      if (attackerGray.length > 0 && attackerColored.length > 0) {
        attackerGray.unshift(attackerColored[attackerColored.length - 1]);
      }
      if (defenderGray.length > 0 && defenderColored.length > 0) {
        defenderGray.unshift(defenderColored[defenderColored.length - 1]);
      }

      setData({
        attackerColored,
        attackerGray,
        defenderColored,
        defenderGray,
      });
    }
  }, [states, actions, selectedState]);

  if (!data) return <p>Loading chart...</p>;

  return (
    <div style={{ height: "400px" }}>
      <Chart>
        <Settings showLegend={true} legendPosition={Position.Top} />
  
        {/* Defender cumulative and future objective values */}
        <AreaSeries
          id="Defender Colored Area"
          name="Defender Cumulative Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderColored}
          color={`${defenderColor}20`} // Trasparente
          hideInLegend
        />
        <LineSeries
          id="Defender Line"
          name="Defender Cumulative Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderColored}
          color={defenderColor} // Primo colore
        />
        <AreaSeries
          id="Defender Gray Area"
          name="Defender Future Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderGray}
          color="rgba(128, 128, 128, 0.2)" // Grigio
          hideInLegend
        />
        <LineSeries
          id="Defender Gray Line"
          name="Defender Future Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderGray}
          color="gray"
          hideInLegend
        />
  
        {/* Attacker cumulative and future objective values */}
        <AreaSeries
          id="Attacker Colored Area"
          name="Attacker Cumulative Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.attackerColored}
          color={`${attackerColor}20`} // Trasparente
          hideInLegend
        />
        <LineSeries
          id="Attacker Line"
          name="Attacker Cumulative Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.attackerColored}
          color={attackerColor} // Ultimo colore
        />
        <AreaSeries
          id="Attacker Gray Area"
          name="Attacker Future Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.attackerGray}
          color="rgba(128, 128, 128, 0.2)" // Grigio
          hideInLegend
        />
        <LineSeries
          id="Attacker Gray Line"
          name="Attacker Future Objective"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.attackerGray}
          color="gray"
          hideInLegend
        />
  
        {/* Axes */}
        <Axis
          id="bottom-axis"
          position={Position.Bottom}
          title="State"
          tickFormat={(value) =>
            states.map((state) => state.state_id).includes(value as number)
              ? value
              : ""
          }
        />
        <Axis
          id="left-axis"
          position={Position.Left}
          title="Objective Function Value"
          gridLine={{
            visible : true,
          }}
        />
      </Chart>
    </div>
  );
  
};
