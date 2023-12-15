import styles from "styles";

import { displayDate, numHoursToTimeString } from "lib/utils";
import { BrushData } from "lib/types";

const BrushDataSentenceSummary: React.FC<{ selectedBrushData: BrushData }> = ({
  selectedBrushData,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        paddingBottom: "0.5rem",
      }}
    >
      <span>
        {`Between `}
        <span style={{ fontWeight: 300 }}>
          {displayDate(selectedBrushData.firstIndexDate)}
        </span>
        {`, and `}
        <span style={{ fontWeight: 300 }}>
          {displayDate(selectedBrushData.lastIndexDate)}
        </span>
        {` (approx. `}
        {numHoursToTimeString(selectedBrushData.width)}
        {` period), the mean energy consumption was `}
      </span>

      <span style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            paddingLeft: "0.3em",
            fontSize: "1.3rem",
            fontWeight: 300,
            alignItems: "center",
            color:
              selectedBrushData.average < 0.3
                ? styles.colorGreen
                : selectedBrushData.average < 0.7
                ? styles.colorYellow
                : styles.colorRed,
          }}
        >
          {` ${selectedBrushData.average.toFixed(2)} kW `}

        </span>
        <span>{`/hour or `}</span>
        <span
          style={{
            paddingLeft: "0.3em",
            fontSize: "1.3rem",
            fontWeight: 300,
            alignItems: "center",
            color:
              selectedBrushData.average < 0.3
                ? styles.colorGreen
                : selectedBrushData.average < 0.7
                ? styles.colorYellow
                : styles.colorRed,
          }}
        >
          {`~$${(0.352*selectedBrushData.average*24*31 + 18).toFixed(0)}`}
        </span>
            <span>{`/month.`}</span>
      </span>
    </div>
  );
};

export default BrushDataSentenceSummary;