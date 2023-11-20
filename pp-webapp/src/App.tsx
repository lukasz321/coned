import React, { useState, useEffect } from "react";
import { Wizard, useWizard } from "react-use-wizard";

import {
  faBars,
  faCheck,
  faCircleChevronDown,
  faCircleChevronUp,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./App.css";
import styles from "styles";

import { monthNames } from 'lib/constants';
import { calculateMean, numHoursToTimeString } from "lib/utils";
import { PowerData, PowerDataItem } from "lib/types";

import InfoBox from "components/info-box";
import Placeholder from "components/placeholder";
import Insight from "components/insight";

import DailyLineChart from "components/daily-line-chart";
import HourlyBarChart from "components/hourly-bar-chart";
import MonthlyBarChart from "components/monthly-bar-chart";
import BillBreakdownPieChart from "components/bill-breakdown-pie-chart";

//TODO: calculate time of use vs regular pricing
// https://www.coned.com/en/accounts-billing/your-bill/time-of-use

//https://recharts.org/en-US/examples/AreaChartFillByValue
// maybe make a moving average akin to a dynamic gas measurer in a Subaru
// maybe the line chart could be:
// stacked bars for day times but
// when "compare to others checked, show lines instea"
// and when "show progress/momentum" show the 3rd chart: Subaru gas chart

// In hourly, show a straight line this month's average? or last's?

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

function displayDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  };

  const formattedDate = date.toLocaleString('en-US', options);

  // Extract AM/PM information and adjust the format
  const time = formattedDate.split(', ')[1];
  const ampm = time.slice(-2);
  const timeWithoutAmPm = time.slice(0, -2);

  return `${formattedDate.split(', ')[0]}, ${timeWithoutAmPm}${ampm}`;
}


async function fetchData() {
  try {
      let apiUrl = "http://0.0.0.0:8181/"; // Default URL for local development

      if (window.location.hostname.includes("power.lzagaja.com")) {
        apiUrl = "https://s3sync-public.s3.amazonaws.com/powerplot.json?v=" + new Date().getTime();

      }
      else if (process.env.REACT_APP_SERVER_LOCAL_IP_ADDRESS) {
          apiUrl = `http://${process.env.REACT_APP_SERVER_LOCAL_IP_ADDRESS}:8181/`;
      }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }


    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
    return data;
    }
    else if (contentType && contentType.includes('binary/octet-stream')) {
        // s3
      const jsonString = await response.text();
      const data = JSON.parse(jsonString);
        return data;
    }
    else {
        return null;
    }

  } catch (error) {
    console.error("There was a problem fetching the data!");
    console.error(error);
    return null;
  }
}

const App: React.FC = () => {
  const [fetchingData, setFetchingData] = useState<boolean>(true);
  const [data, setData] = useState<PowerData | null>(null);
  const [brushData, setBrushAverage] = useState<{
    average: number;
    width: number;
    firstIndexDate: Date;
    lastIndexDate: Date;
  }>({ average: 0, width: 0, firstIndexDate: new Date(Date.now()), lastIndexDate: new Date(Date.now()) });
  const [selectedMonth, setSelectedMonth] = useState<null | undefined | string>(
    undefined,
  );

  useEffect(() => {
    fetchData()
      .then((data) => {
        const powerData: PowerData = PowerData.deserialize(data);
        setData(powerData);
        setFetchingData(false);
      })
      .catch((error) => {
        console.error("Error during fetch!");
        console.error(error);
      });
  }, []);

  return (
    <div className="main">
    {/*
        <div
          style={{
            display: "inline-block",
            padding: "10px 0 0 40px",
          }}
        >
          {data && (
            <Insight
              text={`In the past 24 hours, the mean hourly usage has been ${
                data.hourlyTrend.past24H
              } kWh, which is ${data.hourlyTrend.pctDiff}% ${
                data.hourlyTrend.pctDiff <= 0 ? "lower" : "higher"
              } than the 7-day mean of ${data.hourlyTrend.past7D} kWh.`}
              leadingIcon={
                data.hourlyTrend.pctDiff <= 0
                  ? faCircleChevronUp
                  : faCircleChevronDown
              }
              sentiment={
                data.hourlyTrend.pctDiff <= 0 ? "positive" : "negative"
              }
            />
          )}
        </div>
      */}
      <div className="section">

        {data ? (
        <>

<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
  <span>
    {`Between `}
    <span style={{ fontWeight: 300 }}>{displayDate(brushData.firstIndexDate)}</span>
    {`, and `}
    <span style={{ fontWeight: 300 }}>{displayDate(brushData.lastIndexDate)}</span>
    {` (approx. `}
    {numHoursToTimeString(brushData.width)}
    {`), the mean energy consumption was `}
  </span>
  <span style={{ display: 'flex', alignItems: 'center' }}>
    &nbsp;
    &nbsp;
    <span
      style={{
        fontSize: '1.4em',
        fontWeight: 280,
        color:
          brushData.average < 0.3
            ? styles.colorGreen
            : brushData.average < 0.7
            ? styles.colorYellow
            : styles.colorRed,
      }}
    >
      {` ${brushData.average.toFixed(2)} kW `}
    </span>
    &nbsp;
    &nbsp;
    <span style={{ verticalAlign: 'middle' }}>
      {`per hour.`}
    </span>
  </span>
</div>




            <HourlyBarChart
              data={data.data.hourly}
              dataShown={(data: PowerDataItem[]) => {
                setBrushAverage({
                  average: calculateMean(data.map((d) => d.value)),
                  width: data.length,
                  firstIndexDate: data[0].date,
                  lastIndexDate: data[data.length-1].date,
                });
              }}
            />
            </>
        ) : fetchingData ? (
          <Placeholder />
        ) : (
          <Placeholder text="Unable to load monthly data" error={true} />
        )}
      </div>

      <div className="section">
        {data ? (
          <div
            style={{
              display: "flex",
              height: "100%",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <label style={{ fontSize: "54px", whiteSpace: "nowrap" }}>
                {`Projected ${monthNames[data.data.monthly[data.data.monthly.length - 1].month]} bill is`}
              </label>
            </div>

            <div
              style={{
                marginLeft: "-260px",
                marginRight: "-80px",
                width: "700px",
              }}
            >
              <BillBreakdownPieChart
                projectedBillDollars={data.billing.projectedBillDollars}
                billBreakdown={data.billing.billBreakdown}
              />
            </div>
          </div>
        ) : fetchingData ? (
          <Placeholder />
        ) : (
          <Placeholder text="Unable to load monthly data" error={true} />
        )}
      </div>

      <div className="section">
        {data ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80% 20%",
              height: "80%",
              justifyContent: "center",
              alignItems: "center",
              paddingLeft: "1em",
              paddingRight: "1em",
            }}
          >
            <DailyLineChart
              data={data.data.daily}
              selectedMonth={selectedMonth}
            />
            <MonthlyBarChart // show monthly bars only if there are months to compare...
              data={data.data.monthly}
              onSelectedMonthChanged={(selectedMonth) =>
                setSelectedMonth(selectedMonth)
              }
            />
          </div>
        ) : fetchingData ? (
          <Placeholder />
        ) : (
          <Placeholder text="Unable to load monthly data" error={true} />
        )}
      </div>
    </div>
  );
};

export default App;
