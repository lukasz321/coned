from pathlib import Path
import hashlib
import json
import os

from jsonschema import validate, ValidationError

APP_NAME = "powerplot"

HOME_DIR: Path = Path("~").expanduser()

print(f"Home dir is {HOME_DIR}")
dir_path = os.path.dirname(os.path.realpath(__file__))
print(dir_path)

# This is where the db/data is stored.
DATA_DIR_PATH: Path = HOME_DIR / Path(".local/share/" + APP_NAME)

# Account credentials, preferences, etc.
CONFIG_DIR_PATH: Path = HOME_DIR / Path(".config/" + APP_NAME)
CONFIG_FILE_NAME: str = APP_NAME + ".json"
CONFIG_FILE_PATH: Path = CONFIG_DIR_PATH / Path(CONFIG_FILE_NAME)

TEMP_CACHE_FILE_PATH: Path = Path("/tmp/" + APP_NAME + ".json")

class Config:
    _instance = None

    def __new__(cls, filepath: Path):
        if cls._instance is None:
            cls._instance = super(Config, cls).__new__(cls)
            cls._instance._initialized = False

        return cls._instance

    def __init__(self, filepath: Path):
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
            Path(__file__).parent.absolute() / Path("config_schema.json"), "r"
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

def get_db_name() -> Path:
    """ """
    provider = config["provider"]["provider_name"].replace(" ", "").lower()
    username = config["provider"]["credentials"]["username"]

    sha256 = hashlib.sha256()
    sha256.update(username.encode("utf-8"))
    hashed_username = sha256.hexdigest()[:12]

    return Path(provider + "_" + hashed_username + ".csv")
