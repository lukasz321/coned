import React, { Fragment, useMemo, useState } from "react";
import Toggle from "react-toggle";
import {
  Label,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "App.css";
import styles from "styles";

import { PowerDataItem } from "lib/types";
import { monthNames } from "lib/constants";
import { withOrdinalSuffix } from "lib/utils";
import { tooltipStyle } from "lib/rechart-styles";

const DailyLineChart: React.FC<{
  data: PowerDataItem[];
  selectedMonth?: string | null;
}> = ({ data, selectedMonth }) => {
  const [cumulative, setCumulative] = useState<boolean>(true);
  const currentMonth: string = useMemo(() => {
    // highlight the last month we have data for
    return monthNames[data[data.length - 1].date.getMonth()];
    //return (monthNames[new Date().getMonth()]);
  }, []);

  const sortedData = useMemo(() => {
    // sort the data by months:
    // [
    //   January: { value: 123.4, date: Date() },
    //   February: { ... },
    //   March: { ... } ...
    // ]
    const result: { [key: string]: PowerDataItem[] } = {};

    data.forEach((datarow, idx) => {
      const monthName: string = monthNames[datarow.date.getMonth()];

      if (!result[monthName]) {
        // Initialize this new month.
        result[monthName] = [datarow];
      } else {
        // Calculate the value based on the cumulative flag
        if (cumulative) {
          const previousValue =
            result[monthName][result[monthName].length - 1].value;
          const cumulativeValue = Math.round(previousValue + datarow.value); // eh, this leads to data being a little off
          result[monthName].push({ ...datarow, value: cumulativeValue });
        } else {
          result[monthName].push(datarow);
        }
      }
    });

    return result;
  }, [data, cumulative]);

  return (
  <Fragment>
      <div
        style={{
          position: "absolute",
          display: "flex",
          alignItems: "center",
          gap: "3px",
          zIndex: 2,
          paddingLeft: "85px",
        }}
      >
        <Toggle
          defaultChecked={cumulative}
          icons={false}
          onChange={() => {
            setCumulative(!cumulative);
          }}
        />
        {"cumulative"}
      </div>
    <ResponsiveContainer minHeight="300px">
      <LineChart
        data={data}
        margin={{
          top: 0,
          right: 0,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid stroke="#888" strokeOpacity="0.3" />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "#FFFFFF", background: "transparent" }}
          itemStyle={{
            color: "rgba(255, 255, 255, 0.7",
            background: "transparent",
          }}
          formatter={(value, name, props) => [`${value} kWh`, name]}
          labelFormatter={(label: number) => {
            return withOrdinalSuffix(label);
          }}
        />
        <XAxis
          tick={{ fill: styles.barColorInactive }}
          dataKey="day"
          domain={[1, 31]}
          type="number"
          tickCount={16}
        >
          <Label
            value="Day of the Month"
            position="bottom"
            fill={styles.barColorInactive}
          />
        </XAxis>
        <YAxis
          allowDecimals={false}
          tick={{ fill: styles.barColorInactive }}
          dataKey="value"
          orientation={"left"}
          unit={" kW"}
        >
          <Label
            value=""
            position="inside"
            angle={-90}
            fill={styles.barColorInactive}
          />
        </YAxis>
        {Object.entries(sortedData).map(([monthName, monthData]) => (
          <Line
            key={monthName}
            type="monotone"
            strokeWidth={
              selectedMonth === monthName
                ? styles.lineWidthActive
                : currentMonth === monthName && selectedMonth === undefined
                ? styles.lineWidthActive
                : styles.lineWidthInactive
            }
            strokeOpacity={
              selectedMonth === monthName
                ? styles.lineOpacityActive
                : currentMonth === monthName && selectedMonth === undefined
                ? styles.lineOpacityActive
                : styles.lineOpacityInactive
            }
            stroke={
              selectedMonth === monthName
                ? styles.lineColorActive
                : currentMonth === monthName && selectedMonth === undefined
                ? styles.lineColorActive
                : styles.lineColorInactive
            }
            dot={false}
            dataKey="value"
            name={monthName}
            data={monthData}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
    </Fragment>
  );
};

export default DailyLineChart;
