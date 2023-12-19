import { Cell, ResponsiveContainer, PieChart, Pie } from "recharts";

import "../App.css";
import styles from "styles";

import { DailyBreakdown } from "lib/types";
import { monthNames } from "lib/constants";
import { tooltipStyle } from "lib/rechart-styles";

const DailyBreakdownPieChart: React.FC<{
  data: DailyBreakdown;
  selectedMonth?: string | null;
}> = ({ data, selectedMonth }) => {
  const currentMonth: string = monthNames[new Date().getMonth()];

  return (
    <ResponsiveContainer minHeight="300px">
      <PieChart>
        <Pie
          dataKey="value"
          startAngle={360}
          endAngle={0}
          data={Object.keys(data).map((key) => {
            return { value: data[key as keyof DailyBreakdown], time: key };
          })}
          innerRadius={40}
          outerRadius={50}
          paddingAngle={5}
          label={({
            cx,
            cy,
            midAngle,
            innerRadius,
            outerRadius,
            value,
            index,
          }) => {
            const RADIAN = Math.PI / 180;
            const radius = 25 + innerRadius + (outerRadius - innerRadius);
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);

            return (
              <>
                <text
                  x={x}
                  y={y - 10}
                  fill={styles.pieColorInactive}
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                >
                  {`${Object.keys(data)[index]}`}
                </text>
                <text
                  x={x}
                  y={y + 10}
                  fill={styles.pieColorInactive}
                  opacity={styles.pieOpacityActive}
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                >
                  {`${value}`} kWh
                </text>
              </>
            );
          }}
        >
          {Object.keys(data).map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={styles.pieColorActive}
              stroke={styles.pieColorActive}
              opacity={styles.pieOpacityActive}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DailyBreakdownPieChart;
