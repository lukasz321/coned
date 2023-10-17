import pathlib
import pandas as pd
import numpy as np
import pytz


class PowerData:
    def __init__(self, filepath: pathlib.Path):
        self.filepath = filepath
        self.df = self.read_csv()

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

    def read_csv(self) -> pd.DataFrame:
        """
        Read and process the power data from a CSV file.
        """
        try:
            df = pd.read_csv(self.filepath)
            # Data cleaning and formatting steps
            df["datetime"] = pd.to_datetime(df["datetime"], utc=True)
            df.set_index("datetime", inplace=True)

            est = pytz.timezone("US/Eastern")

            df.index = df.index.tz_convert(est)

            df.index.name = "time"
            df["value"] = df["value"].round(4)
            df.sort_index(inplace=True)
            return df
        except FileNotFoundError as e:
            raise FileNotFoundError(f"File not found: {self.filepath}") from e
        except Exception as e:
            raise Exception(f"Error reading data from {self.filepath}: {e}") from e

    def aggregate_data(self, freq: str) -> pd.DataFrame:
        """
        Aggregate data into chunks based on the specified frequency.
        """
        df = self.df.copy()
        df = df.resample(freq).sum()
        # df.dropna(inplace=True)
        df["value"] = df["value"].round(2)
        return df

    def raw(self) -> pd.DataFrame:
        """
        Return data as JSON in its original 15-minute chunks.
        """
        return self.df

    def hourly(self) -> pd.DataFrame:
        """
        Aggregate data into whole hours and return as JSON.
        """
        return self.aggregate_data("H")

    def daily(self) -> pd.DataFrame:
        """
        Aggregate data into whole days and return as JSON.
        """

        df = self.aggregate_data("D")
        df["month"] = df.index.to_period("M")
        df["cumulative_sum"] = df.groupby("month")["value"].cumsum()
        df.drop(columns=["month"], inplace=True)

        """
        df["previous_month"] = df.index - pd.DateOffset(months=1)

        df["cum_pct_diff"] = 0.0

        for index, row in df.iterrows():
            previous_month = df[df.index == row["previous_month"]]
            if not previous_month.empty:
                current_sum = row["cumulative_sum"]
                previous_sum = previous_month.iloc[0]["cumulative_sum"]
                df.at[index, "cum_pct_diff"] = (
                    current_sum - previous_sum
                ) / previous_sum

        # df.reset_index(inplace=True)

        # df = df.drop(df.index[-1]) # drop the last day because it's likely to be incomplete
        """
        return df

    def monthly(self) -> pd.DataFrame:
        """
        Aggregate data into monthly usage and return as JSON.
        """
        df = self.aggregate_data("M")
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

    def billing(self):
        df = self.monthly().copy()

        last_data_day = self.df.index[-1].day
        extrapolated_usage = df.iloc[-1].value * 31 / last_data_day

        delivery_charge = 0.15553
        system_benefit_charge = 0.00519
        supply_charge = 0.09485
        basic_service_charge = 18.08
        taxes_and_surcharges = 0.09

        projected_bill = (
            delivery_charge
            + system_benefit_charge
            + supply_charge
            + taxes_and_surcharges
        ) * extrapolated_usage + basic_service_charge
        return {
            "extrapolated_usage": extrapolated_usage,
            "basic_service_charge": basic_service_charge,
            "delivery_charge": delivery_charge,
            "system_benefit_charge": system_benefit_charge,
            "supply_charge": supply_charge,
            "projected_bill": projected_bill,
            "taxes_and_surcharges": taxes_and_surcharges,
        }


if __name__ == "__main__":
    import pathlib

    DATA_DIR_PATH = pathlib.Path("~").expanduser() / pathlib.Path(".coned_data")
    MAIN_DB_FILE = DATA_DIR_PATH / pathlib.Path("main.csv")
    data = PowerData(MAIN_DB_FILE)

    # print(data.hourly_mean())
    # print(data.day_breakdown())
    # print(data.day_breakdown(past_72h = True))
