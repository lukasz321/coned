import React, { useState, useEffect } from "react";
import { Wizard, useWizard } from 'react-use-wizard';

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

import { calculateMean, numHoursToTimeString } from "lib/utils";
import { PowerData, PowerDataItem } from "lib/types";
import { fetchPowerData } from "lib/api";

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
        <FontAwesomeIcon icon={faGear} size="xl" style={{ marginRight: "12px" }} />
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
        <FontAwesomeIcon icon={faBars} size="xl" style={{ marginRight: "12px" }} />
        status: healthy{" "}
        <FontAwesomeIcon icon={faCheck} style={{ color: "#00CC66" }} />
      </button>
    </div>
  );
};

/*
const Step1 = () => {
  const { handleStep, previousStep, nextStep } = useWizard();

  // Attach an optional handler
  handleStep(() => {
    alert('Going to step 2');
  });

  return (
    <>
      <button onClick={() => previousStep()}>Previous ⏮️</button>
      <button onClick={() => nextStep()}>Next ⏭</button>
    </>
  );
};

const Step2 = () => {
  const { handleStep, previousStep, nextStep } = useWizard();

  // Attach an optional handler
  handleStep(() => {
    alert('Going to step 2');
  });

  return (
    <>
      <button onClick={() => previousStep()}>Previous ⏮️</button>
      <button onClick={() => nextStep()}>Next ⏭</button>
    </>
  );
};
*/


const App: React.FC = () => {
  const [fetchingData, setFetchingData] = useState<boolean>(true);
  const [data, setData] = useState<PowerData | null>(null);
  const [brushData, setBrushAverage] = useState<{
    average: number;
    width: number;
  }>({ average: 0, width: 0 });
  const [selectedMonth, setSelectedMonth] = useState<null | undefined | string>(
    undefined,
  );

  useEffect(() => {
    const fetchData = async () => {
      const powerData = await fetchPowerData();
      if (powerData) {
        setData(powerData);
        setFetchingData(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="main">

      <div className="section" style={{ height: "370px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "10px 0 0 40px",
          }}
        >
          {data && (
            <Insight
              text={`In the past 24 hours, the mean hourly usage has been ${
                data.hourlyBreakdown.past24H
              } kWh, which is ${data.hourlyBreakdown.pctDiff}% ${
                data.hourlyBreakdown.pctDiff <= 0 ? "lower" : "higher"
              } than the 7-day mean of ${data.hourlyBreakdown.past7D} kWh.`}
              leadingIcon={
                data.hourlyBreakdown.pctDiff <= 0
                  ? faCircleChevronUp
                  : faCircleChevronDown
              }
              sentiment={
                data.hourlyBreakdown.pctDiff <= 0 ? "positive" : "negative"
              }
            />
          )}
        </div>

        {data ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "20% 75%",
              height: "100%",
              //gridAutoFlow: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {brushData.average && (
              <InfoBox
                primaryText={brushData.average.toFixed(1)}
                trailingText={`kWh avg over ${numHoursToTimeString(
                  brushData.width,
                )}`}
                color={
                  brushData.average > 1.0
                    ? styles.colorRed
                    : brushData.average > 0.5
                    ? styles.colorYellow
                    : styles.colorGreen
                }
              />
            )}
            <HourlyBarChart
              data={data.hourly}
              dataShown={(data: PowerDataItem[]) => {
                setBrushAverage({
                  average: calculateMean(data.map((d) => d.value)),
                  width: data.length,
                });
              }}
            />
          </div>
        ) : fetchingData ? (
          <Placeholder />
        ) : (
          <Placeholder text="Unable to load monthly data" error={true} />
        )}
      </div>

      <div className="section" style={{ height: "270px" }}>
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
                This month's projected bill is
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
                data={{
                  Basic_Service: data.billing.basicServiceCharge,
                  Taxes_and_Surcharges: data.billing.projectedBill * 0.045 * 2,
                  Delivery:
                    data.billing.deliveryCharge *
                    data.billing.extrapolatedUsage,
                  Benefit_Charge:
                    data.billing.systemBenefitCharge *
                    data.billing.extrapolatedUsage,
                  Supply:
                    data.billing.supplyCharge * data.billing.extrapolatedUsage,
                }}
                projectedBill={data.billing.projectedBill}
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
        <div
          style={{
            display: "inline-block",
            gap: "20px",
            padding: "10px 0 30px 40px",
          }}
        >
          <Insight
            text={"To date, you have used 5.5% less power than last month."}
            leadingIcon={faCircleChevronDown}
            sentiment={"positive"}
          />
        </div>
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
            <DailyLineChart data={data.daily} selectedMonth={selectedMonth} />
            <MonthlyBarChart // show monthly bars only if there are months to compare...
              data={data.monthly}
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
