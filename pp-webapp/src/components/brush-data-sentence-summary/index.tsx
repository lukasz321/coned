import styles from "styles";

import { displayDate, numHoursToTimeString } from "lib/utils";
import { BrushData } from "lib/types";

const HOURLY_AVG_RED_ZONE = 0.5;
const HOURLY_AVG_YELLOW_ZONE = 0.3;

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
              selectedBrushData.average < HOURLY_AVG_YELLOW_ZONE
                ? styles.colorGreen
                : selectedBrushData.average < HOURLY_AVG_RED_ZONE
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
              selectedBrushData.average < HOURLY_AVG_YELLOW_ZONE
                ? styles.colorGreen
                : selectedBrushData.average < HOURLY_AVG_RED_ZONE
                ? styles.colorYellow
                : styles.colorRed,
          }}
        >
          {/* rough back of the envelope calculation here, make it a variable though*/}
          {`~$${(0.352 * selectedBrushData.average * 24 * 31 + 18).toFixed(0)}`}
        </span>
        <span>{`/month.`}</span>
      </span>
    </div>
  );
};

export default BrushDataSentenceSummary;
