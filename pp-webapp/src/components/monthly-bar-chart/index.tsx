import React, { useMemo, useState } from "react";
import {
  Bar,
  Cell,
  Label,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "App.css";
import styles from "styles";

import { tooltipStyle } from "lib/rechart-styles";
import { PowerDataItem } from "lib/types";
import {
  monthNames,
  abbrevMonthNames,
  superAbbrevMonthNames,
} from "lib/constants";

const MonthlyBarChart: React.FC<{
  data: PowerDataItem[];
  onSelectedMonthChanged?: (selectedMonth: string | null) => void;
  onHighlightedMonthChanged?: (highlightedMonth: string | null) => void;
}> = ({ data, onSelectedMonthChanged, onHighlightedMonthChanged }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(
    data.length - 1,
  );
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);

  const maxValue = useMemo(
    () =>
      data.reduce(
        (max, current) => (current.value > max ? current.value : max),
        data[0].value,
      ),
    [data],
  );

  return (
    <ResponsiveContainer minHeight="300px">
      <BarChart
        data={data.slice(-12)}
        maxBarSize={50}
        margin={{
          top: 0,
          right: 20,
          left: 0,
          bottom: 20,
        }}
      >
        <Bar
          dataKey="value"
          onClick={(evt, idx) => {
            setSelectedIdx(selectedIdx === idx ? null : idx);

            if (onSelectedMonthChanged) {
              onSelectedMonthChanged(
                selectedIdx === idx ? null : monthNames[evt.month],
              );
            }
          }}
          onMouseEnter={(evt, idx) => {
            setHighlightedIdx(idx);
            if (onHighlightedMonthChanged) {
              onHighlightedMonthChanged(
                selectedIdx === idx ? null : monthNames[evt.month],
              );
            }
          }}
          onMouseLeave={(evt, idx) => {
            setHighlightedIdx(null);
            if (onHighlightedMonthChanged) {
              onHighlightedMonthChanged(null);
            }
          }}
          label={{
            position: "top",
            fill: "white",
            opacity: 1,
          }}
        >
          {data.map((entry, idx) => (
            <Cell
              key={`bar-${idx}`}
              cursor="pointer"
              fill={
                idx === selectedIdx
                  ? styles.barColorActive
                  : styles.barColorInactive
              }
              opacity={
                idx === highlightedIdx
                  ? styles.barOpacityActive
                  : styles.barOpacityInactive
              }
            />
          ))}
        </Bar>
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{
            stroke: "transparent",
            strokeWidth: 1,
            strokeOpacity: 0.1,
            fill: "rgba(255, 255, 255, 0.2)",
          }}
          formatter={(value, name, props) => [`${value} kWh`, null]}
          itemStyle={{
            color: "rgba(255, 255, 255, 0.9",
            background: "transparent",
          }}
          labelFormatter={(label) => {
            const date = new Date(label);
            return monthNames[date.getMonth()];
          }}
          labelStyle={{ color: "#FFFFFF", background: "transparent" }}
        />
        <XAxis
          tick={{ fill: styles.barColorInactive }}
          dataKey="date"
          tickFormatter={(date) => {
            // start abbreviating months once there's enough columns
            const monthNameFunction =
              data.length > 4
                ? superAbbrevMonthNames
                : data.length > 2
                ? abbrevMonthNames
                : abbrevMonthNames;
            const monthName = monthNameFunction[new Date(date).getMonth()];
            return monthName;
          }}
        >
          <Label
            value="Month"
            position="bottom"
            fill={styles.barColorInactive}
          />
        </XAxis>
        <YAxis
          allowDecimals={false}
          tick={{ fill: styles.barColorInactive }}
          orientation={"right"}
          domain={[0, Math.ceil((maxValue * 1.1) / 100) * 100]}
          tickCount={Math.ceil((maxValue * 1.1) / 100) + 1}
          tickFormatter={(value) => Math.floor(value).toString()}
          //unit={"kWh"}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyBarChart;
