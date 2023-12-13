import pathlib
import pandas as pd
import numpy as np
import pytz


class PowerData:
    """
    Class facilitating manipulation of Power Usage Data through
    DataFrame operations.
    """

    def __init__(self, filepath: pathlib.Path):
        """
        Read and process the power data from a CSV file.
        """

        self.df = None

        try:
            df = pd.read_csv(filepath)

            df["datetime"] = pd.to_datetime(df["datetime"], utc=True)
            df.set_index("datetime", inplace=True)

            # TODO: Auto detect the time zone
            df.index = df.index.tz_convert(pytz.timezone("US/Eastern"))
            df.index.name = "time"

            df["value"] = df["value"].round(3)  # Let's lower the resolution a tad,
            df.sort_index(inplace=True)
            self.df = df
        except FileNotFoundError as e:
            raise FileNotFoundError(f"File not found: {filepath}") from e
        except Exception as e:
            raise Exception(f"Error reading data from {filepath}: {e}") from e

    def __str__(self):
        return str(self.df)

    @classmethod
    def to_json(cls, df):
        """
        Serialize a DataFrame to JSON, formatting the index.
        """
        _df = df.copy()
        _df.index = _df.index.strftime("%Y-%m-%d %H:%M:%S-%z").str.replace("--", "-")
        return _df["value"].to_dict()

    def resample(self, frequency: str) -> pd.DataFrame:
        """
        Aggregate data into chunks based on the specified frequencyuency.
        """
        df = self.df.copy()
        df = df.resample(frequency).sum()
        # df.dropna(inplace=True)
        df["value"] = df["value"].round(2)
        return df

    def hourly(self) -> pd.DataFrame:
        """
        Aggregate data into whole hours and return as JSON.
        """
        return self.resample("H")

    def daily(self) -> pd.DataFrame:
        """
        Aggregate data into whole days and return as JSON.
        """

        df = self.resample("D")
        df["month"] = df.index.to_period("M")
        df["cumulative_sum"] = df.groupby("month")["value"].cumsum()
        df.drop(columns=["month"], inplace=True)
        return df

    def monthly(self) -> pd.DataFrame:
        """
        Aggregate data into monthly usage and return as JSON.
        """
        df = self.resample("M")
        df["value"] = df["value"].round(0)
        # df.index = df.index.strftime('%B')
        return df

    def day_breakdown(self, last_num_hours: int = 0) -> dict:
        df = self.hourly().copy()
        df = df.tail(last_num_hours) if last_num_hours > 0 else df
        df["time_of_day"] = pd.cut(
            df.index.hour,
            bins=[0, 6, 12, 18, 24],
            labels=["night", "morning", "afternoon", "evening"],
        )
        result = df.groupby("time_of_day", observed=False)["value"].mean().round(2)
        return result.to_dict()

    def hourly_mean(self):
        df = self.hourly().copy()
        df = df.tail(7 * 24)
        hourly_average_week = df["value"].mean().round(2)
        df = df.tail(24)
        hourly_average_day = df["value"].mean().round(2)

        pct_difference = round(
            (hourly_average_day - hourly_average_week) / hourly_average_week * 100, 1
        )
        return {
            "past_24h": hourly_average_day,
            "past_7d": hourly_average_week,
            "pct_diff": pct_difference,
        }

    def bill_breakdown(self):
        """ """

        df_monthly = self.monthly()
        df_daily = self.daily().dropna() # Drop days without data...

        # Extrapolate the usage based on the current day of the month.
        # TODO: this shouldnt include "today", as that skews the projection badly
        #       in early months due to the current day often being 'partial'
        last_data_day = self.df.index[-1].day
        NUM_TRAILING_DAYS = 14
        # Until there's at least X full days of data in this, use an X-day rolling average to estimate
        if last_data_day < NUM_TRAILING_DAYS:
            # Note that the latest day is excluded as the data is likely to be partial
            average_daily_usage_kwh = df_daily.tail(NUM_TRAILING_DAYS + 1).head(NUM_TRAILING_DAYS)['value'].mean()
            extrapolated_usage_kwh = average_daily_usage_kwh * 31
        else:
            extrapolated_usage_kwh = df_monthly.iloc[-1].value / last_data_day * 31

        # These charges are supplier dependent most likely. 
        # Introduce the notion of supplier to the API once new integrations are added.
        if "coned" == "coned":
            basic_service_charge = 18.08
            delivery_charge = 0.15553 * extrapolated_usage_kwh
            system_benefit_charge = 0.00519 * extrapolated_usage_kwh
            supply_charge = 0.09485 * extrapolated_usage_kwh
            grt_and_surcharges = 0.045 * (
                basic_service_charge
                + delivery_charge
                + system_benefit_charge
                + supply_charge
            )  # This is very ballpark...
            sales_tax = 0.045 * (grt_and_surcharges + grt_and_surcharges / 0.045)

            extrapolated_usage_dollars = (
                basic_service_charge
                + delivery_charge
                + system_benefit_charge
                + supply_charge
                + grt_and_surcharges
                + sales_tax
            )

            return {
                "projected_bill_kwh": int(extrapolated_usage_kwh),
                "projected_bill_dollars": int(extrapolated_usage_dollars),
                "bill_breakdown": {  # in dollars
                    "basic_service": basic_service_charge,
                    "surcharges": round(grt_and_surcharges, 2),
                    "delivery": round(delivery_charge, 2),
                    "system_benefit": round(system_benefit_charge, 2),
                    "supply": round(supply_charge, 2),
                    "sales_tax": round(sales_tax, 2),
                },
            }
