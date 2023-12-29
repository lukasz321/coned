import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "App.css";
import styles from "styles";

import { PowerDataItem } from "lib/types";
import { monthNames, hourlyPeriods } from "lib/constants";
import { toWeekdayName, calculateMean } from "lib/utils";
import { tooltipStyle } from "lib/rechart-styles";

const WeekBubbleChart: React.FC<{
  data: PowerDataItem[];
  selectedMonth?: string | null;
}> = ({ data, selectedMonth }) => {
  // Do past 10 days partOfTheDay breakdown?
  const sortedData = useMemo(() => {
    const currentDay: Date = new Date();
    currentDay.setHours(23, 59, 59);

    const latestDatapoint = data[data.length - 1];

    const firstDataDay: Date = new Date(latestDatapoint.date);
    firstDataDay.setHours(23, 59, 59);
    const weekEarlier: Date = new Date(firstDataDay);
    weekEarlier.setDate(firstDataDay.getDate() - 7);

    const reversedData = data
      .slice(data.length - 7 * 24, data.length)
      .filter((d) => d.date.getTime() > weekEarlier.getTime());
    // Complete the current day
    for (let hour = latestDatapoint.hour + 1; hour <= 23; hour++) {
      const date: Date = new Date(latestDatapoint.date);
      date.setHours(hour, 0, 0, 0);
      reversedData.push({
        date: date,
        value: 0,
        month: latestDatapoint.month,
        day: latestDatapoint.day,
        hour: hour,
      });
    }

    const filteredData: { [daysDifference: number]: any[] } = {};

    reversedData.forEach((datapoint, idx) => {
      const day: string = toWeekdayName(datapoint.date);
      const timeDifference = currentDay.getTime() - datapoint.date.getTime();
      const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

      if (!filteredData[daysDifference]) {
        filteredData[daysDifference] = [];
      }

      filteredData[daysDifference].push({
        ...datapoint,
        humanHour: hourlyPeriods[datapoint.hour],
        yValue: 1,
        humanDay: day,
      });
    });

    return filteredData;
  }, [data]);

  const maxDomain = useMemo(() => {
    return Math.max(...Object.entries(data).map(([k, d]) => d.value));
  }, [sortedData]);

  const domain = [0, maxDomain];
  const range = [0, maxDomain*150];

  return (
    sortedData && (
      <div style={{ width: "100%" }}>
        {Object.entries(sortedData).map(([dayNo, dayData]: [any, any], idx) => (
          <div style={{ display: "flex" }}>
            <ResponsiveContainer width="100%" height={60}>
              <ScatterChart
                margin={{
                  top: 12,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
              >
                <XAxis
                  type="category"
                  dataKey="humanHour"
                  interval={0}
                  tick={{ fill: "#fff", fontSize: idx === 6 ? 16 : 0 }}
                  tickLine={{ transform: "translate(0, -6)" }}
                />
                <YAxis
                  type="number"
                  dataKey="yValue"
                  name={dayData[0].humanDay}
                  height={10}
                  width={100}
                  tick={false}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: `${dayData[0].humanDay}`,
                    position: "insideTopRight",
                    angle: 0,
                    fontSize: "1rem",
                    fill: "#fff",
                  }}
                />
                {/*Make sure yesterday actually happened yesterday*/}
                <ZAxis
                  type="number"
                  dataKey="value"
                  domain={domain}
                  range={range}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  wrapperStyle={{ zIndex: 100 }}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: "#FFFFFF", background: "transparent" }}
                    itemStyle={{
                      color: "rgba(255, 255, 255, 0.9",
                      background: "transparent",
                      fontWeight: "350",
                    }}
                    formatter={(value, name, props) => {
                        let _name = "";
                        let _value = null;
                        switch (name) {
                            case "humanHour":
                               _name = "Time";
                               _value = value as number;
                                return [`${value}`, _name];
                            case "value":
                               _name = "Used";
                               _value = `${value} kWh`;
                                return [_value, _name];
                        }

                                return [name, "Day"];

                        }}
                    labelFormatter={(label: number) => {
                      return "";
                    }}
                />
                <Scatter
                  data={dayData}
                  fill={styles.bubbleColorActive}
                  opacity={styles.bubbleOpacityActive}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <div
              style={{
                paddingTop: "3px",
                width: "9em",
                display: "flex",
                color: "#fff",
              }}
            >
              {`x\u0305 = ${calculateMean(
                dayData.map((d: any) => d.value).filter((d: number) => d > 0),
              ).toFixed(2)} kWh`}
            </div>
          </div>
        ))}
      </div>
    )
  );
};

export default WeekBubbleChart;
