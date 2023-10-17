import argparse
import hashlib
import time
import os

import pandas as pd

from .provider import Provider
from .providers.coned import ConEd
from .config import config, get_db_name, DATA_DIR_PATH

try:
    assert Provider(config["provider"]["provider_name"]) != None
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
    #merged_df.drop(columns=["endTime"], inplace=True)

    # Save the merged and sorted DataFrame to a new CSV file
    merged_df.to_csv(DATA_FILE_PATH, index=True)


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

    args = parser.parse_args()

    provider = Provider(config["provider"]["provider_name"])

    while True:
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
            raise Exception("No data returned!")

        if not args.no_merge:
            append_to_db(data)

        if args.oneshot:
            break

        print("Going to sleep...")
        time.sleep(config.get("poll_frequency_hours", 6) * 3600)
