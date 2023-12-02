import React, { Fragment, useState, useEffect } from "react";
import {
  faBars,
  faCheck,
  faCircleChevronDown,
  faCircleChevronUp,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const HealthPanel: React.FC<{}> = ({}) => {
  const [status, setStatus] = useState<boolean>(true);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [highlighted, setHighlighted] = useState<boolean>(false);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <button
        className="status"
        onClick={() => {
          //setPanelOpen(!panelOpen);
        }}
        onMouseEnter={() => {
          setHighlighted(true);
        }}
        onMouseLeave={() => {
          setHighlighted(false);
        }}
      >
        <FontAwesomeIcon
          icon={faGear}
          size="xl"
          style={{ marginRight: "12px" }}
        />
      </button>

      <button
        className="status"
        onClick={() => {
          //setPanelOpen(!panelOpen);
        }}
        onMouseEnter={() => {
          setHighlighted(true);
        }}
        onMouseLeave={() => {
          setHighlighted(false);
        }}
      >
        <FontAwesomeIcon
          icon={faBars}
          size="xl"
          style={{ marginRight: "12px" }}
        />
        status: healthy{" "}
        <FontAwesomeIcon icon={faCheck} style={{ color: "#00CC66" }} />
      </button>
    </div>
  );
};
