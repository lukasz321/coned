import axios, { AxiosInstance, AxiosResponse } from "axios";

import { client } from "./client";
import { DailyBreakdown, PowerData } from "./types";

export type PowerDataAPI = {
  monthly: Record<string, number>;
  hourly: Record<string, number>;
  daily: Record<string, number>;
  maths: {
    daily_breakdown: {
      past_24h: DailyBreakdown;
      past_48h: DailyBreakdown;
      past_7d: DailyBreakdown;
    };
    hourly_breakdown: {
      past_24h: number;
      past_7d: number;
      pct_diff: number;
    };
  };
  billing: {
      extrapolated_usage: number;
      basic_service_charge: number;
      delivery_charge: number;
      system_benefit_charge: number;
      supply_charge: number;
      projected_bill: number;
      taxes_and_surcharges: number;
  };
};

export const fetchPowerData = async (): Promise<PowerData | null> => {
  const apiData = (await client.get("/data/all")) as PowerDataAPI;
  return apiData ? PowerData.unpackFromAPI(apiData) : null;
  {
  }
};
