import os
import pathlib
import threading

from .power_data import PowerData

DB_FILE_PATH = pathlib.Path("~").expanduser() / pathlib.Path(
    ".local/share/powerplot/conedison_7fe600bb69a4.csv"
)


class DataHandler:
    """
    Unfortunately, using a threading lock is essential for ensuring thread safety when
    updating shared resources (like data and last_modified) across multiple threads
    which FastAPI inherently employs.
    """

    def __init__(self):
        self.data: PowerData = None
        self.last_modified: float = None  # epoch utc timestamp

        self.data_lock = threading.Lock()
        self.last_modified_lock = threading.Lock()

        self.reload()

    def reload(self):
        """
        If the file was modified since the last read, reload the db into a DataFrame.
        Otherwise, return the DataFrame already in the memory.
        """

        db_last_modified = os.path.getmtime(DB_FILE_PATH)

        with self.last_modified_lock:
            if self.data is None or db_last_modified != self.last_modified:
                with self.data_lock:
                    self.data = PowerData(DB_FILE_PATH)

                self.last_modified = db_last_modified

        return self.data


if __name__ == "__main__":
    handler = DataHandler()
