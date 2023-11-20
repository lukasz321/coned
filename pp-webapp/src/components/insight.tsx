import { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Sentiment } from "lib/types";

import styles from "styles";

const Insight: React.FC<{
  sentiment: Sentiment; // sentiment decides the color
  text: string;
  leadingIcon?: IconDefinition;
  trailingIcon?: IconDefinition;
}> = ({ sentiment, text, leadingIcon, trailingIcon }) => {
  let color = styles.colorDarkGray;
  if (sentiment === "positive") {
    color = styles.colorGreen;
  } else if (sentiment === "negative") {
    color = styles.colorRed;
  }

  return (
    <div
      style={{
        display: "grid",
        gridAutoFlow: "column",
      }}
    >
      {leadingIcon && (
        <FontAwesomeIcon
          icon={leadingIcon}
          style={{ color, paddingRight: "15px", opacity: 0.85 }}
        />
      )}
      <span className="insight">{text}</span>
      {trailingIcon && (
        <FontAwesomeIcon
          icon={trailingIcon}
          style={{ color, paddingLeft: "15px", opacity: 0.85 }}
        />
      )}
    </div>
  );
};

export default Insight;
