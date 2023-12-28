import React, { useMemo, useEffect, useState } from "react";

import {
  Bar,
  Line,
  Label,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

import "App.css";
import styles from "styles";

import { WeatherDataItem, PowerDataItem } from "lib/types";
import { monthNames, abbrevMonthNames } from "lib/constants";
import { toWeekdayName, withOrdinalSuffix } from "lib/utils";
import { tooltipStyle } from "lib/rechart-styles";

const HourlyBarChart: React.FC<{
  data: PowerDataItem[];
  weatherData: WeatherDataItem[];
  title?: string;
  dataShown?: (shownData: PowerDataItem[]) => void;
}> = ({ data, weatherData, title, dataShown }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);
  const [brushWidth, setBrushWidth] = useState<
    "day" | "week" | "month" | "year"
  >("day");

  const SHOW_LAST_NUM_DAYS = 5; //...on page load
  const maxValue = useMemo(
    () =>
      data.reduce(
        (max, current) => (current.value > max ? current.value : max),
        data[0].value,
      ),
    [data],
  );

  const maxWeatherValue = useMemo(() => {
    if (weatherData.length > 0) {
      return weatherData.reduce(
        (max, current) => (current.value > max ? current.value : max),
        weatherData[0].value,
      );
    }

    return 0;
  }, [weatherData]);

  useEffect(() => {
    if (dataShown) {
      dataShown(data.slice(data.length - 24 * SHOW_LAST_NUM_DAYS));
    }
  }, [data, dataShown]);

  const combinedData = useMemo(() => {
    if (weatherData) {
      return data.map((powerItem) => {
        const weatherItem = weatherData.find(
          (weather) => weather.date.getTime() === powerItem.date.getTime(),
        );

        return {
          date: powerItem.date,
          value: powerItem.value,
          weatherValue: weatherItem ? weatherItem.value : null,
        };
      });
    } else {
      return data;
    }
  }, [data, weatherData]);

  return (
    <div style={{ paddingRight: "3em" }}>
      <ResponsiveContainer minHeight="300px">
        <ComposedChart data={combinedData}>
          {weatherData ? (
            <>
              <XAxis xAxisId={2} hide={true} dataKey="date" />
              <YAxis
                yAxisId={"right"}
                domain={[0, Math.ceil(maxWeatherValue / 10) * 10]}
                tickCount={Math.min(8, Math.ceil(maxWeatherValue / 10))}
                unit={" F"}
                allowDecimals={false}
                tick={{ fill: styles.barColorInactive }}
                orientation={"right"}
              >
                <Label
                  value="" // FIXME
                  angle={-90}
                  position="insideEnd"
                  offset={30}
                  fill={styles.barColorInactive}
                />
              </YAxis>
              <Line
                xAxisId={2}
                yAxisId={"right"}
                dataKey="weatherValue"
                dot={false}
                stroke={styles.colorBlue}
                strokeWidth={8}
                opacity={0.3}
              />
            </>
          ) : null}
          <Bar
            xAxisId={1}
            yAxisId={"left"}
            dataKey="value"
            onClick={(evt, idx) => {
              //setSelectedIdx(selectedIdx === idx ? null : idx);
            }}
            onMouseEnter={(evt, idx) => {
              //setHighlightedIdx(idx);
            }}
            onMouseLeave={(evt, idx) => {
              //setHighlightedIdx(null);
            }}
          >
            {data.map((entry, idx) => (
              <Cell
                key={`bar-${idx}`}
                fill={
                  idx === selectedIdx
                    ? styles.barColorActive
                    : styles.barColorActive
                }
                opacity={
                  idx === highlightedIdx || idx === selectedIdx
                    ? styles.barOpacityActive
                    : styles.barOpacityInactive
                }
              />
            ))}
          </Bar>
          <CartesianGrid stroke="#888" strokeOpacity="0.3" />
          <Brush
            fill="rgba(0, 0, 88, 0.4)"
            stroke="rgba(200, 200, 200, 0.8)"
            travellerWidth={10}
            startIndex={data.length - 24 * SHOW_LAST_NUM_DAYS} // looking at the past 48 hours by default
            onChange={(evt) => {
              if (evt.endIndex && evt.startIndex) {
                const indexWidth = evt.endIndex - evt.startIndex;

                if (
                  indexWidth <= 6 * 24 &&
                  evt.startIndex > data.length - 24 * 6
                ) {
                  setBrushWidth("day");
                } else if (indexWidth <= 28 * 24) {
                  setBrushWidth("week");
                } else if (indexWidth <= 90 * 24) {
                  setBrushWidth("month");
                } else {
                  setBrushWidth("year");
                }
              }

              if (dataShown) {
                dataShown(
                  data.slice(
                    evt.startIndex,
                    evt.endIndex ? evt.endIndex + 1 : evt.endIndex,
                  ),
                );
              }
            }}
            height={25}
            tickFormatter={(idx) => {
              return data[idx].date.toDateString();
            }}
          />

          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{
              stroke: "transparent",
              strokeWidth: 1,
              strokeOpacity: 0.1,
              fill: "rgba(255, 255, 255, 0.2)",
            }}
            formatter={(value, name, props) => {
              if (props.name === "weatherValue") {
                return [`${value} deg F`, null];
              } else {
                return [`${value} kWh`, null];
              }
            }}
            itemStyle={{
              color: "rgba(255, 255, 255, 0.9",
              background: "transparent",
              fontWeight: 350,
            }}
            labelFormatter={(label) => {
              const date = new Date(label);

              const day = toWeekdayName(label, true);
              const hour = date.getHours();
              const ampm = hour >= 12 ? "PM" : "AM";

              const dateDay = `${day}, ${abbrevMonthNames[date.getMonth()]} 
                  ${withOrdinalSuffix(date.getDate())}`;

              // Convert to 12-hour time format
              const formattedHour = hour % 12 || 12;

              return `${dateDay}, ${formattedHour}:00-${formattedHour}:59${ampm}`;
            }}
            labelStyle={{ color: "#FFFFFF", background: "transparent" }}
          />
          <XAxis
            xAxisId={1}
            tick={{ fill: styles.barColorInactive }}
            dataKey="date"
            //interval="preserveStartEnd"
            minTickGap={brushWidth === "day" ? 120 : 60}
            tickFormatter={(date) => {
              const d = new Date(date);
              const day = toWeekdayName(d, true);
              const hour = d.getHours();
              const ampm = hour >= 12 ? "PM" : "AM";
              const formattedHour = hour % 12 || 12;

              switch (brushWidth) {
                case "day":
                  return `${day} ${formattedHour}${ampm}`;
                case "week":
                  return `${abbrevMonthNames[d.getMonth()]} 
                  ${withOrdinalSuffix(d.getDate())} (${day})`;
                case "month":
                  return `${abbrevMonthNames[d.getMonth()]} 
                  ${withOrdinalSuffix(d.getDate())} (${day})`;
                default:
                  return `${monthNames[d.getMonth()]}`;
              }
            }}
          />
          <YAxis
            yAxisId={"left"}
            domain={[0, Math.ceil(maxValue)]}
            tickCount={Math.min(8, Math.ceil(maxValue) + 1)}
            unit={" kW"}
            allowDecimals={false}
            tick={{ fill: styles.barColorInactive }}
            orientation={"left"}
          >
            <Label
              value="" // FIXME
              angle={-90}
              position="insideEnd"
              offset={30}
              fill={styles.barColorInactive}
            />
          </YAxis>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HourlyBarChart;
