import React, { useState } from "react";

import styles from "styles";

import { Fade, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import {
  List,
  Code,
  HelpOutline,
  AlternateEmail,
  ErrorOutline,
  Done,
} from "@mui/icons-material";

import { PowerData } from "lib/types";

import PaypalDialog from "components/paypal-dialog";

const menuBarStyle = { color: "#fff", opacity: 0.8 };

const AppBar: React.FC<{
  data: Pick<PowerData, "lastUpdated" | "lastUpdatedSecondsAgo">;
}> = ({ data }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: "1em",
        paddingRight: "1.4em",
      }}
    >
      <div>
        <Tooltip title="You're looking at actual electric power consumption of our Brooklyn apartment. The data is scraped from our provider (ConEd) and updated every 12 hours.">
          <IconButton size="large" onClick={(event) => {}}>
            <HelpOutline style={menuBarStyle} />
          </IconButton>
        </Tooltip>

        {/*
        <Tooltip title="This project is open sourced!">
          <a
            href="https://github.com/lukasz321/powerplot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconButton size="large">
              <Code style={menuBarStyle} />
            </IconButton>
          </a>
        </Tooltip>
        */}
        <Tooltip title="Say hello!">
          <IconButton size="large">
            <AlternateEmail style={menuBarStyle} />
          </IconButton>
        </Tooltip>
        <PaypalDialog />
        <IconButton
          aria-label="menu-button"
          size="large"
          onClick={(event) => setMenuAnchorEl(event.currentTarget)}
        >
          <List style={menuBarStyle} />
        </IconButton>

        {/*
        <Menu
          id="fade-menu"
          anchorEl={menuAnchorEl}
          MenuListProps={{
            "aria-labelledby": "fade-button",
          }}
          open={menuAnchorEl !== null}
          onClose={() => setMenuAnchorEl(null)}
          TransitionComponent={Fade}
        >
          <MenuItem onClick={() => {}}>This</MenuItem>
          <MenuItem onClick={() => {}}>will be</MenuItem>
          <MenuItem onClick={() => {}}>a menu.</MenuItem>
        </Menu>
        */}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          color: "#fff",
          fontWeight: 250,
          gap: "0.4em",
        }}
      >
        {`Data last fetched on ${data.lastUpdated}`}
        {data.lastUpdatedSecondsAgo <= 3600 * 24 ? (
          <Done style={{ color: styles.colorGreen }} />
        ) : (
          <Tooltip title="It's likely that the electricity provider has live data service outage. Sadly, outages longer than 24h result in loss of data.">
            <ErrorOutline style={{ color: styles.colorRed }} />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default AppBar;
