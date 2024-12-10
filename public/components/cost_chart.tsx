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
  const { selectedState } = useTreeContext(); // Get the selected state from context
  const [data, setData] = useState<{
    attackerColored: { x: number; y: number }[];
    attackerGray: { x: number; y: number }[];
    defenderColored: { x: number; y: number }[];
    defenderGray: { x: number; y: number }[];
  } | null>(null);

  useEffect(() => {
    if (states && actions) {
      const attackerData: { x: number; y: number }[] = [];
      const defenderData: { x: number; y: number }[] = [];

      let cumulativeAttackerCost = 0;
      let cumulativeDefenderCost = 0;

      // Calculate cumulative costs
      states.forEach((state) => {
        const stateActions = actions.filter((action) =>
          state.actions_id.includes(action.id)
        );

        const attackerCost = stateActions
          .filter((action) => action.agent === "attacker")
          .reduce((sum, action) => sum + action.cost, 0);

        const defenderCost = stateActions
          .filter((action) => action.agent === "defender")
          .reduce((sum, action) => sum + action.cost, 0);

        cumulativeAttackerCost += attackerCost;
        cumulativeDefenderCost += defenderCost;

        attackerData.push({ x: state.state_id, y: cumulativeAttackerCost });
        defenderData.push({ x: state.state_id, y: cumulativeDefenderCost });
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

        {/* Defender cumulative and future costs */}
        <AreaSeries
          id="Defender Colored Area"
          name="Defender Cumulative Cost"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderColored}
          color="rgba(0, 0, 255, 0.2)"
          hideInLegend
        />
        <LineSeries
          id="Defender Line"
          name="Defender Cumulative Cost"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderColored}
          color="blue"
        />
        <AreaSeries
          id="Defender Gray Area"
          name="Defender Future Cost"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderGray}
          color="rgba(128, 128, 128, 0.2)"
          hideInLegend
        />
        <LineSeries
          id="Defender Gray Line"
          name="Defender Future Cost"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.defenderGray}
          color="gray"
          hideInLegend
        />

        {/* Attacker cumulative and future costs */}
        <AreaSeries
          id="Attacker Colored Area"
          name="Attacker Cumulative Cost"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.attackerColored}
          color="rgba(255, 0, 0, 0.2)"
          hideInLegend
        />
        <LineSeries
          id="Attacker Line"
          name="Attacker Cumulative Cost"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.attackerColored}
          color="red"
        />
        <AreaSeries
          id="Attacker Gray Area"
          name="Attacker Future Cost"
          xScaleType={ScaleType.Linear}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={["y"]}
          data={data.attackerGray}
          color="rgba(128, 128, 128, 0.2)"
          hideInLegend
        />
        <LineSeries
          id="Attacker Gray Line"
          name="Attacker Future Cost"
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
          title="Cumulative Cost"
          showGridLines
        />
      </Chart>
    </div>
  );
};
