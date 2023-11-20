import { DailyBreakdown, PowerData } from "./types";

export type RawPowerData = {
  last_updated: string;
  last_updated_seconds_ago: number;
  systemd: Record<string, boolean>;
  projected_bill: {
    projected_bill_kwh: number;
    projected_bill_dollars: number;
    bill_breakdown: Record<string, number>;
  };
  data: {
    monthly: Record<string, number>;
    hourly: Record<string, number>;
    daily: Record<string, number>;
  };

  statistics_and_trends: {
    day_breakdown: {
      past_24h: DailyBreakdown;
      past_48h: DailyBreakdown;
      past_7d: DailyBreakdown;
    };
    hourly_mean_trend: {
      past_24h: number;
      past_7d: number;
      pct_diff: number;
    };
  };
};
