import { Label, Cell, ResponsiveContainer, PieChart, Pie } from "recharts";

import "../App.css";
import styles from "styles";

import { BillBreakdown } from "lib/types";

const BillBreakdownPieChart: React.FC<{
  data: BillBreakdown;
  projectedBill: number;
}> = ({ data, projectedBill }) => {
  return (
    <ResponsiveContainer minHeight="200px">
      <PieChart>
        <Pie
          dataKey="value"
          startAngle={250}
          endAngle={470}
          data={Object.keys(data).map((key) => {
            return { value: data[key as keyof BillBreakdown], time: key };
          })}
          innerRadius={80}
          outerRadius={90}
          paddingAngle={3}
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
                  style={{
                    fontSize: "11pt",
                    font: "Helvetica",
                    fontWeight: "10",
                    opacity: "0.7",
                  }}
                  x={x}
                  y={y - 10}
                  stroke={styles.pieColorInactive}
                  fill={styles.pieColorInactive}
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                >
                  {`${Object.keys(data)[index].split("_").join(" ")}` +
                    `, ${((value / projectedBill) * 100).toFixed(1)}%`}
                </text>
                <text
                  style={{
                    fontSize: "13pt",
                    font: "Helvetica",
                    fontWeight: "100",
                  }}
                  x={x}
                  y={y + 10}
                  stroke={styles.pieColorInactive}
                  fill={styles.pieColorInactive}
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                >
                  {`$${value.toFixed(0)}`}
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
          <Label
            value={`$${projectedBill.toFixed(0)}`}
            position="center"
            fill="#ffffff"
            fontSize={60}
            fontWeight={400}
          />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default BillBreakdownPieChart;
