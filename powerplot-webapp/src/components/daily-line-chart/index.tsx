import React, { Fragment, useMemo, useState } from "react";
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
import "./index.css";
import styles from "styles";

import { PowerDataItem } from "lib/types";
import { monthNames } from "lib/constants";
import { withOrdinalSuffix } from "lib/utils";
import { tooltipStyle } from "lib/rechart-styles";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const DailyLineChart: React.FC<{
  data: PowerDataItem[];
  selectedMonth?: string | null;
  highlightedMonth?: string | null;
}> = ({ data, selectedMonth, highlightedMonth }) => {
  const [cumulative, setCumulative] = useState<boolean>(true);

  const currentMonth: string = useMemo(() => {
    // Highlight the last month we have the data for...
    return monthNames[data[data.length - 1].date.getMonth()];
  }, [data]);

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
          paddingLeft: "91px",
        }}
      >
        <ToggleButtonGroup
          color="primary"
          value={cumulative ? "cumulative" : "daily"}
          exclusive
          onChange={(
            event: React.MouseEvent<HTMLElement>,
            newValue: string,
          ) => {
            switch (newValue) {
              case "daily":
                setCumulative(false);
                break;
              case "cumulative":
                setCumulative(true);
                break;
            }
          }}
        >
          <ToggleButton size="small" value="daily">
            Daily
          </ToggleButton>
          <ToggleButton size="small" value="cumulative">
            Cumulative
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <ResponsiveContainer minHeight="300px" key={`${cumulative}`}>
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
              color: "rgba(255, 255, 255, 0.9",
              background: "transparent",
              fontWeight: "350",
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
            allowDuplicatedCategory={false}
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
                  : highlightedMonth === monthName
                  ? 1
                  : styles.lineOpacityInactive / 2
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
