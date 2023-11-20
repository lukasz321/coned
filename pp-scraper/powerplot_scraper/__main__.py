import argparse
import time
import os
from datetime import datetime, timedelta

import pandas as pd

from .provider import Provider
from .provider_coned import ConEd
from .config import config, get_db_name, DATA_DIR_PATH
from .installation_wizard import main as installation_wizard

try:
    assert Provider(config["provider"]["provider_name"]) is not None
except KeyError:
    print("Configuration incomplete. Run installation wizard via TODO.")
    exit(1)


def append_to_db(data: pd.DataFrame):
    DATA_FILE_PATH = DATA_DIR_PATH / get_db_name()

    try:
        db = pd.read_csv(DATA_FILE_PATH)
        db["datetime"] = pd.to_datetime(db["datetime"])

        merged_df = pd.concat([db, data])
    except FileNotFoundError:
        # This must be the very first write...
        os.makedirs(DATA_DIR_PATH, exist_ok=True)
        merged_df = data

    # Drop duplicates and keep the last occurrence: new data overrides DB data.
    merged_df = merged_df.drop_duplicates(subset="datetime", keep="last")

    merged_df.sort_values(by="datetime", inplace=True)
    merged_df.set_index("datetime", inplace=True)

    # Save the merged and sorted DataFrame to a new CSV file
    merged_df.to_csv(DATA_FILE_PATH, index=True)
    print(f"Saved the data to {DATA_FILE_PATH}")


def get_power_consumption_data(provider_name: str, **kwargs):
    """
    Wrapper for requesting power data from different energy providers.
    """
    if Provider(provider_name) == Provider.CONED:
        required_keys = ["username", "password", "two_factor_auth_response"]

        for key in required_keys:
            if key not in kwargs:
                raise ValueError(f"Missing required argument: {key}")

        coned = ConEd(
            username=kwargs["username"],
            password=kwargs["password"],
            mfa=kwargs["two_factor_auth_response"],
        )
        if not coned.login():
            raise Exception("Failed to login.")

        return coned.get_power_consumption_data()
    else:
        raise Exception("Unknown provider!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--oneshot",
        action="store_true",
        help="Poll data once and quit. Otherwise, this service runs until interrupted",
    )

    parser.add_argument(
        "--no_merge",
        action="store_true",
        help="",
    )

    parser.add_argument(
        "--install",
        action="store_true",
        help="",
    )

    args = parser.parse_args()

    if args.install:
        installation_wizard()
        exit(0)

    provider = Provider(config["provider"]["provider_name"])

    while True:
        print(f"Polling the data for provider {provider.value}...")
        if provider == Provider.CONED:
            data: pd.DataFrame = get_power_consumption_data(
                provider_name=config["provider"]["provider_name"],
                username=config["provider"]["credentials"]["username"],
                password=config["provider"]["credentials"]["password"],
                two_factor_auth_response=config["provider"]["credentials"][
                    "two_factor_auth_response"
                ],
            )

        if data is None or data.empty:
            if not args.onesot:
                print(
                    "No date returned! Exiting, letting systemd restart in RestartSec."
                )

            raise Exception("No data returned!")

        if not args.no_merge:
            print("Merging data...")
            append_to_db(data)

        if args.oneshot:
            break

        next_poll_in = config.get("poll_frequency_hours", 12) * 3600
        next_poll_date = datetime.now() + timedelta(seconds=next_poll_in)

        NUM_UPDATES = 3
        for i in range(0, NUM_UPDATES):
            print(
                f"Next poll in {round(1/(NUM_UPDATES-i)*next_poll_in/3600, 1)} hour(s) on {next_poll_date}."
            )
            time.sleep(next_poll_in / NUM_UPDATES)
