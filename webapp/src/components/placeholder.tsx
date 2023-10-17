import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import styles from "styles";

const Placeholder: React.FC<{ text?: string; error?: boolean }> = ({
  text,
  error = false,
}) => {
  const icon = error ? faTriangleExclamation : faSpinner;
  const color = error ? styles.colorYellow : undefined;
  const style = error ? { paddingLeft: "15px" } : undefined;

  return (
    <div className="placeholder">
      {text && <p>{text}</p>}
      <FontAwesomeIcon
        icon={icon}
        style={{ color, ...style }}
        spin={error ? false : true}
        bounce={error ? true : false}
        size="xl"
      />
    </div>
  );
};

export default Placeholder;
