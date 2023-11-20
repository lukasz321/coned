import pathlib
import hashlib
import json
import os

from jsonschema import validate, ValidationError

HOME_DIR: pathlib.Path = pathlib.Path("~").expanduser()

# This is where the data AKA our simple .csv database is stored.
DATA_DIR_PATH: pathlib.Path = HOME_DIR / pathlib.Path(".local/share/powerplot")
if not DATA_DIR_PATH.exists():
    DATA_DIR_PATH.mkdir(parents=True, exist_ok=True)

# Account credentials, preferences, etc.
CONFIG_DIR_PATH: pathlib.Path = HOME_DIR / pathlib.Path(".config/powerplot")
if not CONFIG_DIR_PATH.exists():
    CONFIG_DIR_PATH.mkdir(parents=True, exist_ok=True)

CONFIG_FILE_PATH: pathlib.Path = CONFIG_DIR_PATH / pathlib.Path("powerplot.json")


class Config:
    _instance = None

    def __new__(cls, filepath: pathlib.Path):
        if cls._instance is None:
            cls._instance = super(Config, cls).__new__(cls)
            cls._instance._initialized = False

        return cls._instance

    def __init__(self, filepath: pathlib.Path):
        self.filepath = filepath

        if self._initialized:
            return

        self._initialized = True

        try:
            with open(self.filepath, "r") as f:
                self.contents = json.load(f)
        except FileNotFoundError:
            self.contents = {}
            directory = os.path.dirname(self.filepath)

            if not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)

            with open(self.filepath, "w") as f:
                json.dump(self.contents, f, indent=4)
        except json.JSONDecodeError as e:
            raise Exception("Corrupted config file, this is unhandled yet.") from e

        with open(
            pathlib.Path(__file__).parent.absolute()
            / pathlib.Path("config_schema.json"),
            "r",
        ) as schema_file:
            self.schema = json.load(schema_file)

    def save(self):
        with open(self.filepath, "w") as f:
            json.dump(self.contents, f, indent=4)

    def __getitem__(self, key):
        keys = key.split(".")
        current_dict = self.contents

        for k in keys:
            current_dict = current_dict[k]

        return current_dict

    def __setitem__(self, key, value):
        keys = key.split(".")
        current_dict = self.contents

        for k in keys[:-1]:
            current_dict = current_dict.setdefault(k, {})

        current_dict[keys[-1]] = value

        try:
            validate(instance=current_dict, schema=self.schema)
        except ValidationError as e:
            print(f"Validation error: {e}")

        self.save()

    def get(self, key, default=None):
        try:
            return self[key]
        except (KeyError, TypeError):
            return default

    def print(self):
        print(json.dumps(self.contents, indent=4))


config = Config(CONFIG_FILE_PATH)  # from config import config


def get_db_name() -> pathlib.Path:
    """ """

    try:
        provider = config["provider"]["provider_name"].replace(" ", "").lower()
        username = config["provider"]["credentials"]["username"]

        sha256 = hashlib.sha256()
        sha256.update(username.encode("utf-8"))
        hashed_username = sha256.hexdigest()[:12]

        return pathlib.Path(provider + "_" + hashed_username + ".csv")
    except KeyError:
        print("Unconfigured.")
