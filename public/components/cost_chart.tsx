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
  const { selectedState, defenderColor, attackerColor, totalColor } = useTreeContext();
  const [data, setData] = useState<{
    attackerColored: { x: number; y: number }[];
    attackerGray: { x: number; y: number }[];
    defenderColored: { x: number; y: number }[];
    defenderGray: { x: number; y: number }[];
    totalColored: { x: number; y: number }[];
    totalGray: { x: number; y: number }[];
  } | null>(null);

  // Pesature per la funzione obiettivo
  const wt = 0.5;
  const wc = 0.5;

  useEffect(() => {
    if (states && actions) {
      const attackerData: { x: number; y: number }[] = [];
      const defenderData: { x: number; y: number }[] = [];
      const totalData: { x: number; y: number }[] = [];

      let cumulativeAttackerCost = 0;
      let cumulativeAttackerTime = 0;
      let cumulativeDefenderCost = 0;
      let cumulativeDefenderTime = 0;

      states.forEach((state) => {
        const stateActions = actions.filter((action) =>
          state.actions_id.includes(action.id)
        );

        // Calcolo cumulativo dei costi e tempi
        const attackerCost = stateActions
          .filter((action) => action.agent === "attacker")
          .reduce((sum, action) => sum + action.cost, 0);

        const attackerTime = stateActions
          .filter((action) => action.agent === "attacker")
          .reduce((sum, action) => sum + action.time, 0);

        const defenderCost = stateActions
          .filter((action) => action.agent === "defender")
          .reduce((sum, action) => sum + action.cost, 0);

        const defenderTime = stateActions
          .filter((action) => action.agent === "defender")
          .reduce((sum, action) => sum + action.time, 0);

        cumulativeAttackerCost += attackerCost;
        cumulativeAttackerTime += attackerTime;
        cumulativeDefenderCost += defenderCost;
        cumulativeDefenderTime += defenderTime;

        // Calcolo della funzione obiettivo
        const attackerObjective =
          wt * cumulativeAttackerTime + wc * cumulativeAttackerCost;
        const defenderObjective =
          wt * cumulativeDefenderTime + wc * cumulativeDefenderCost;
        const totalObjective = attackerObjective + defenderObjective;

        attackerData.push({ x: state.state_id, y: attackerObjective });
        defenderData.push({ x: state.state_id, y: defenderObjective });
        totalData.push({ x: state.state_id, y: totalObjective });
      });

      // Divisione dei dati in segmenti colorati e grigi
      const splitData = (data: { x: number; y: number }[]) => ({
        colored: data.filter((point) => point.x <= selectedState),
        gray: data.filter((point) => point.x >= selectedState),
      });

      const attackerSplit = splitData(attackerData);
      const defenderSplit = splitData(defenderData);
      const totalSplit = splitData(totalData);

      // Aggiunta dei punti di confine
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
  }, [states, actions, selectedState]);

  if (!data) return <p>Loading chart...</p>;

  return (
    <div style={{ height: "400px" }}>
      <Chart>
      <Settings
  showLegend={true}
  legendPosition={Position.Top}
  tooltip={{
    customTooltip: ({ header, values }) => {
      // Filtra i valori per escludere le AreaSeries
      const filteredValues = values.filter(
        (value) =>
          value.seriesIdentifier.specId !== "Attacker Colored Area" &&
          value.seriesIdentifier.specId !== "Attacker Gray Area" &&
          value.seriesIdentifier.specId !== "Defender Colored Area" &&
          value.seriesIdentifier.specId !== "Defender Gray Area" &&
          value.seriesIdentifier.specId !== "Total Colored Area" &&
          value.seriesIdentifier.specId !== "Total Gray Area"
      );

      return (
        <div
        style={{
          padding: "10px",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
        }}
        >
          <div style={{ fontWeight: "bold" }}>{`State: ${header?.value}`}</div>
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
          lineSeriesStyle={{
            line:{
              strokeWidth: 2,
            },
            point:{
              visible: true,
              radius: 3,
              fill: attackerColor,
            }
          }}
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
          lineSeriesStyle={{
            line:{
              strokeWidth: 2,
            },
            point:{
              visible: true,
              radius: 3,
              fill: defenderColor,
            }
          }}
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
          color= {totalColor}
          lineSeriesStyle={{
            line:{
              strokeWidth: 3,
            },
            point:{
              visible: true,
              radius: 3,
              fill: totalColor,
            }
          }}
        />

        {/* Axes */}
        <Axis 
          id="bottom-axis" 
          position={Position.Bottom} 
          title="State" 
          gridLine={{
            visible: true,
          }}
          />
        <Axis
          id="left-axis"
          position={Position.Left}
          title="Objective Function Value"
          gridLine={{
            visible: true,
          }}
        />
      </Chart>
    </div>
  );
};
