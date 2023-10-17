import { PowerDataAPI } from "./api";
export type FIXME = any;

export type Sentiment = "positive" | "negative" | "neutral";

export type DailyBreakdown = {
  morning: number;
  evening: number;
  afternoon: number;
  night: number;
};

export type BillBreakdown = {
  [key: string]: number;
};


export type PowerDataItem = {
  date: Date;
  value: number;
  month: number;
  day: number;
  hour: number;
};

export type PowerData = {
  monthly: PowerDataItem[];
  hourly: PowerDataItem[];
  daily: PowerDataItem[];
  dailyBreakdown: {
    past7D: DailyBreakdown;
    past24H: DailyBreakdown;
    past48H: DailyBreakdown;
  };
  hourlyBreakdown: {
    past7D: number;
    past24H: number;
    pctDiff: number;
  };
  billing: {
      projectedBill: number;
      extrapolatedUsage: number;
      basicServiceCharge: number;
      deliveryCharge: number;
      systemBenefitCharge: number;
      supplyCharge: number;
      taxesAndSurcharges: number;
  };
};


export namespace PowerData {
  export function unpackFromAPI(apiData: PowerDataAPI): PowerData {
    return {
      monthly: mapData(apiData.monthly),
      hourly: mapData(apiData.hourly),
      daily: mapData(apiData.daily),
      dailyBreakdown: {
        past7D: apiData.maths.daily_breakdown.past_7d,
        past24H: apiData.maths.daily_breakdown.past_24h,
        past48H: apiData.maths.daily_breakdown.past_48h,
      },
      hourlyBreakdown: {
        past7D: apiData.maths.hourly_breakdown.past_7d,
        past24H: apiData.maths.hourly_breakdown.past_24h,
        pctDiff: apiData.maths.hourly_breakdown.pct_diff,
      },
        billing: {
          projectedBill: apiData.billing.projected_bill,
          extrapolatedUsage: apiData.billing.extrapolated_usage,
          basicServiceCharge: apiData.billing.basic_service_charge,
          deliveryCharge: apiData.billing.delivery_charge,
          systemBenefitCharge: apiData.billing.system_benefit_charge,
          supplyCharge: apiData.billing.supply_charge,
          taxesAndSurcharges: apiData.billing.taxes_and_surcharges,
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
