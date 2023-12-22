import { DailyBreakdown } from "./types";

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

export async function fetchData() {
  try {
    let apiUrl = "http://0.0.0.0:8181/";

    if (window.location.hostname.includes("powerplot")) {
      apiUrl =
        "https://s3sync-public.s3.amazonaws.com/powerplot.json?v=" +
        new Date().getTime(); // so that the browser doesn't cache anything
    } else if (process.env.REACT_APP_SERVER_LOCAL_IP_ADDRESS) {
      // when run locally, fetch from a server expected to run on the same machine
      apiUrl = `http://${process.env.REACT_APP_SERVER_LOCAL_IP_ADDRESS}:8181/`;
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    } else if (contentType && contentType.includes("binary/octet-stream")) {
      // fetching the data from s3
      const jsonString = await response.text();
      const data = JSON.parse(jsonString);
      return data;
    } else {
      return null;
    }
  } catch (error) {
    console.error("There was a problem fetching the data!");
    console.error(error);
    return null;
  }
}


export type RawWeatherData = {
    hourly: {
        temperature_2m: number[],
        time: number[],
    };
    utc_offset_seconds: number;
};


export async function fetchWeatherData() {
  try {
    const timezone = 'America/New_York'; // Set your timezone
    const latitude = 40.7128; // Set latitude
    const longitude = -74.0060; // Set longitude

    const base_url = 'https://api.open-meteo.com/v1/forecast';
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      hourly: 'temperature_2m',
      timeformat: 'unixtime',
      timezone,
      start_date: '2023-10-12',
      end_date: (new Date()).toISOString().split('T')[0],
      format: 'json',
      temperature_unit: 'fahrenheit',
    });

    const apiUrl = `${base_url}?${params.toString()}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }
    return response.json();
  } catch (error) {
    console.error("There was a problem fetching the data!");
    console.error(error);
    return null;
  }
}
