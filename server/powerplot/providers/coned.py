# pylint: disable=C0103 W1203 W1514
import os
import time
import json
import pathlib
import logging

from typing import Union, Optional
import requests
import pandas as pd

from ..utils.prompt import Prompt

log = logging.getLogger(__name__)
log.setLevel("DEBUG")

os.system("mkdir -p /var/cache/powerplot")

class ConEd:
    cache_file_path = "/var/cache/powerplot/powerplot.json"
    
    @classmethod
    def wizard(cls):
        username = Prompt.input("Enter your username:")
        password = Prompt.input("Enter your password:")
        coned = cls(username, password, use_cached_credentials=False)

        try:
            coned.login()
        except Exception as e:
            print(str(e))
            return None

        print("Logged in successfully. Trying to access power usage data...")

        try:
            coned.get_power_consumption_data()
        except Exception as e:
            print(str(e))
            return None

        print("All good! Your account is configured.")

        return {
            "username": coned.username,
            "password": coned.password,
            "two_factor_auth_response": coned.mfa,
        }

    def __init__(
        self,
        username: str,
        password: str,
        mfa: Optional[str] = None,
        use_cached_credentials: bool = True,
    ):
        self.meter_id = None
        self.account_uuid = None
        self.data = None
        self.username = username
        self.password = password
        self.mfa = mfa
        self.base_url = "https://www.coned.com/sitecore/api/ssc"
        self.session = requests.Session()  # self.session.cookies
        self.session.headers.update(
            {
                "Accept": "*/*",
                "Connection": "keep-alive",
                "Content-Type": "application/json",
                "Origin": "https://www.coned.com",
                "Referer": "https://www.coned.com/",
            }
        )

        if use_cached_credentials:
            self.load_cache()

    def load_cache(self):
        """
        Cache stores information required to get the energy consumption data.
        We can get by without cache, but we'd need to make 2 extra calls.

        {
            "johnsmith@gmail.com": {
                "meter_id": 123859,
                "account_uuid": "123s-yeh1e1",
            }
        }
        """

        try:
            with open(ConEd.cache_file_path, "r") as f:
                contents = json.load(f)

            self.meter_id = contents.get(self.username, {}).get("meter_id", None)
            self.account_uuid = contents.get(self.username, {}).get(
                "account_uuid", None
            )
        except FileNotFoundError:
            pass

    def save_to_cache(self, key: str, value: Union[str, int]):
        print("Saving to cache...")
        try:
            with open(ConEd.cache_file_path, "r") as f:
                contents = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            contents = {}

        user_cache = contents.setdefault(self.username, {})
        user_cache[key] = value

        with open(ConEd.cache_file_path, "w") as f:
            json.dump(contents, f, indent=4)

    def request(self, url: str, data: dict = None):
        log.debug(f"Making a request to {url}")

        if data:
            response = self.session.post(url, json=data)
        else:
            response = self.session.get(url)

        log.debug(response)
        if "application/json" in response.headers.get("Content-Type", ""):
            log.debug(json.dumps(response.json(), indent=4))
        else:
            log.debug(response)

        try:
            response.raise_for_status()
        except Exception:
            raise
        else:
            return response

    def login(self):
        log.info(f"\nLogging in {self.username}...")
        url = f"{self.base_url}/ConEdWeb-Foundation-Login-Areas-LoginAPI/User/0/Login"
        return_url = "%2Fen%2Faccounts-billing%2Fmy-account%2Fenergy-use%3Ftab1%3DsectionRealTimeData-2"
        data = {
            "LoginEmail": self.username,
            "LoginPassword": self.password,
            "ReturnUrl": return_url,
        }
        response_json = self.request(url=url, data=data).json()

        if not response_json.get("login"):
            print(response_json)
            raise Exception(
                f'Failed to login successfully: {response_json.get("loginErrorMsg", "your username or password are incorrect")}.'
            )
        log.info("OK")

        if response_json.get("newDevice") and not response_json.get("noMfa"):
            prompt = (
                response_json.get("newDeviceText")
                .split(":")[-1]
                .replace('"', "")
                .strip()
            )

            if not self.mfa:
                Prompt.acknowledge(
                    "ConEd requires two-factor authorization. Press ENTER to continue"
                )
                self.mfa = Prompt.input(prompt)

            # We're asked to perform the two factor authorization.
            log.info("Going through two factor auth...")
            log.info(prompt + " " + self.mfa)

            response_json = self.request(
                url=f"{self.base_url}/ConEdWeb-Foundation-Login-Areas-LoginAPI/User/0/VerifyFactor",
                data={
                    "MFACode": self.mfa,
                    "ReturnUrl": return_url,
                },
            ).json()

            if not response_json.get("code", ""):
                raise Exception("Failed to 2FA.")

            log.info("OK\n")

        # While this request returns no data of interest, it returns some essential cookies.
        if response_json.get("authRedirectUrl"):
            log.info("\nFetching token cookies...")
            self.request(url=response_json["authRedirectUrl"])
            log.info("OK")
        else:
            raise KeyError('"authRedirectUrl" was not returned.')

        log.info("\nGetting the OPOWER token...")
        url = f"{self.base_url}/ConEd-Cms-Services-Controllers-Opower/OpowerService/0/GetOPowerToken"
        response = self.request(url=url)
        token = response.text.strip('"')
        self.session.headers["authorization"] = f"Bearer {token}"
        log.info("OK. Updated the headers.")

        return True

    def get_power_consumption_data(self) -> bool:
        if not self.account_uuid:
            log.info("\nFetching account UUID...")
            # Get account metadata, we're interested in the account id specifically -
            # Cache that away...
            response = self.request(
                url="https://cned.opower.com/ei/edge/apis/DataBrowser-v1/cws/metadata"
            )
            accounts = (
                response.json().get("fuelTypeServicePoint", {}).get("ELECTRICITY", [])
            )
            if not accounts:
                raise Exception("Unable to determine the account UUID.")

            self.account_uuid = accounts[0].get("accountUuid")

            if not self.account_uuid:
                raise Exception("No account uuid.")

            log.info(f"account_uuid: {self.account_uuid}")

            # This shouldn't ever change, save to cache to avoid calling this bit in the future -
            self.save_to_cache("account_uuid", self.account_uuid)

        if not self.meter_id:
            log.info("\nFetching meter ID...")
            # Get the meter ID...
            url = f"https://cned.opower.com/ei/edge/apis/cws-real-time-ami-v1/cws/cned/accounts/{self.account_uuid}/meters"
            response = self.request(url=url)
            try:
                self.meter_id = response.json().get("meters_ids", [])[-1]
            except IndexError:
                raise Exception("No meter ids.")

            log.info(f"meter_id: {self.meter_id}")

            # This shouldn't ever change, save to cache to avoid calling this bit in the future -
            self.save_to_cache("meter_id", self.meter_id)

        assert self.meter_id
        assert self.account_uuid

        # Finally, fetch the real time usage data...
        url = f"https://cned.opower.com/ei/edge/apis/cws-real-time-ami-v1/cws/cned/accounts/{self.account_uuid}/meters/{self.meter_id}/usage"
        response = self.request(url=url)

        # Save to a dataframe -
        self.data = pd.json_normalize(response.json(), record_path="reads")
        self.data["datetime"] = pd.to_datetime(self.data["startTime"])
        self.data.dropna(subset=["value"], inplace=True)
        self.data.drop(columns=["startTime", "endTime"], inplace=True)
        return self.data

    @staticmethod
    def export_to_csv(
        coned_instance: "ConEd", target_dir: pathlib.Path
    ) -> pathlib.Path:
        if coned_instance.data is None:
            log.error("There's no data to export!")
            return

        log.info("Exporting to csv...")
        file_name = (
            coned_instance.username.split("@")[0] + "_" + str(int(time.time())) + ".csv"
        )
        file_path = pathlib.Path(target_dir) / pathlib.Path(file_name)

        os.system(f"mkdir -p {target_dir}")

        coned_instance.data.to_csv(file_path, index=False)
        log.info(file_path)
        return file_path


if __name__ == "__main__":
    coned = ConEd.wizard()
