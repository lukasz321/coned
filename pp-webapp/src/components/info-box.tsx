import React from "react";

const InfoBox: React.FC<{
  primaryText: string;
  leadingText?: string;
  trailingText?: string;
  color?: string;
}> = ({ primaryText, leadingText, trailingText, color }) => {
  return (
    <div
      style={{
        display: "grid",
        gridAutoFlow: "row",
        justifyContent: "center",
        alignItems: "center",
        opacity: "0.85",
        width: "100%",
      }}
    >
      {leadingText && (
        <label
          style={{
            fontSize: "19px",
            fontWeight: 300,
            width: 'fit-content',
              margin: 'auto',
          }}
        >
          {leadingText}
        </label>
      )}
      <label
        style={{
          fontSize: "100px",
          fontWeight: 200,
          color,
        }}
      >
        {primaryText}
      </label>
      {trailingText && (
        <label
          style={{
            fontSize: "19px",
            fontWeight: 300,
            width: 'fit-content',
              margin: 'auto',
          }}
        >
          {trailingText}
        </label>
      )}
    </div>
  );
};

export default InfoBox;
