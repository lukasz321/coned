import { RawPowerData } from "./api";
export type FIXME = any;

export type Sentiment = "positive" | "negative" | "neutral";

export interface DailyBreakdown {
  morning: number;
  evening: number;
  afternoon: number;
  night: number;
}

export interface PowerDataItem {
  date: Date;
  value: number;
  month: number;
  day: number;
  hour: number;
}

// Data which gets passed to Brush summary.
export interface BrushData {
  average: number;
  width: number;
  firstIndexDate: Date;
  lastIndexDate: Date;
}

export type PowerData = {
  lastUpdated: string;
  lastUpdatedSecondsAgo: number;
  systemdHealth: Record<string, boolean>;
  data: {
    monthly: PowerDataItem[];
    hourly: PowerDataItem[];
    daily: PowerDataItem[];
  };
  dayBreakdown: {
    past7D: DailyBreakdown;
    past24H: DailyBreakdown;
    past48H: DailyBreakdown;
  };
  hourlyTrend: {
    past7D: number;
    past24H: number;
    pctDiff: number;
  };
  billing: {
    projectedBillKWH: number;
    projectedBillDollars: number;
    billBreakdown: Record<string, number>;
  };
};

// eslint-disable-next-line
export namespace PowerData {
  export function deserialize(apiData: RawPowerData): PowerData {
    // Deserialize the data received from the API.

    return {
      lastUpdated: apiData.last_updated,
      lastUpdatedSecondsAgo: apiData.last_updated_seconds_ago,
      systemdHealth: apiData.systemd,
      data: {
        monthly: mapData(apiData.data.monthly),
        hourly: mapData(apiData.data.hourly),
        daily: mapData(apiData.data.daily),
      },
      dayBreakdown: {
        past7D: apiData.statistics_and_trends.day_breakdown.past_7d,
        past24H: apiData.statistics_and_trends.day_breakdown.past_24h,
        past48H: apiData.statistics_and_trends.day_breakdown.past_48h,
      },
      hourlyTrend: {
        past7D: apiData.statistics_and_trends.hourly_mean_trend.past_7d,
        past24H: apiData.statistics_and_trends.hourly_mean_trend.past_24h,
        pctDiff: apiData.statistics_and_trends.hourly_mean_trend.pct_diff,
      },
      billing: {
        projectedBillKWH: apiData.projected_bill.projected_bill_kwh,
        projectedBillDollars: apiData.projected_bill.projected_bill_dollars,
        billBreakdown: apiData.projected_bill.bill_breakdown,
      },
    };
  }

  function mapData(dataObject: Record<string, number>): PowerDataItem[] {
    return Object.entries(dataObject).map(([timeString, value]) => {
      const date = new Date(timeString);
      const month = date.getMonth();
      const day = date.getDate();
      const hour = date.getHours();

      return {
        date,
        value,
        month,
        day,
        hour,
      };
    });
  }
}
