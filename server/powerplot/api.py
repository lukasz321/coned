import os
import json
import csv
import time
import threading
import uvicorn

from fastapi import FastAPI, Path
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .config import config, get_db_name, DATA_DIR_PATH
from .power_data import PowerData

app = FastAPI()

# Add the GZipMiddleware to enable response compression
# app.add_middleware(GZipMiddleware, minimum_size=1000)  # Adjust the minimum size as needed
# automatically unpack if Content-Encoding: gzip

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # You can specify the HTTP methods you want to allow
    allow_headers=["*"],  # You can specify the HTTP headers you want to allow
)

data = None
data_last_modified = None
data_lock = threading.Lock()
last_modified_lock = threading.Lock()


def load_data():
    """
    If the datafile has not been modified since the last request,
    simply return the cached instance.
    """
    global data
    global data_last_modified
    
    db_path = DATA_DIR_PATH / get_db_name()

    last_modified = os.path.getmtime(db_path)

    with last_modified_lock:
        if data is None or last_modified != data_last_modified:
            with data_lock:
                data = PowerData(db_path)
            data_last_modified = last_modified

    return data


load_data()


@app.get("/health")
async def health_data():
    if data_last_modified:
        timestamp_struct = time.localtime(data_last_modified)
        human_readable_date = time.strftime("%B %d, %Y %I:%M:%S %p", timestamp_struct)
        seconds_ago = time.time() - data_last_modified

        return JSONResponse(
            content={
                "last_downloaded": {
                    "datetime:": data_last_modified,
                    "seconds_ago": second_ago,
                }
            },
            status_code=200,
        )
    else:
        return JSONResponse(
            content={"error": "Unable to determine when the data was last modified."},
            status_code=500,
        )


@app.get("/data/{data_set}")
async def power_usage_data(data_set: str = Path(..., title="Data Set")):
    try:
        data = load_data()

        if data:
            if data_set == "hourly":
                return JSONResponse(content=data.hourly(), status_code=200)
            elif data_set == "daily":
                return JSONResponse(content=data.daily(), status_code=200)
            elif data_set == "monthly":
                return JSONResponse(content=data.monthly(), status_code=200)
            elif data_set == "raw":
                return JSONResponse(content=data.raw(), status_code=200)
            elif data_set == "all":
                return JSONResponse(
                    content={
                        "maths": {
                            "daily_breakdown": {
                                "past_24h": data.day_breakdown(last_num_hours=24),
                                "past_48h": data.day_breakdown(last_num_hours=48),
                                "past_7d": data.day_breakdown(last_num_hours=(24 * 7)),
                            },
                            "hourly_breakdown": data.hourly_mean(),
                        },
                        "hourly": PowerData.to_json(data.hourly()),
                        "monthly": PowerData.to_json(data.monthly()),
                        "daily": PowerData.to_json(data.daily()),
                        "billing": data.billing(),
                    },
                    status_code=200,
                )
            else:
                return JSONResponse(
                    content={"error": "Invalid data set requested!"}, status_code=400
                )
        else:
            return JSONResponse(
                content={"error": "CSV file is empty!"}, status_code=400
            )
    except FileNotFoundError:
        return JSONResponse(content={"error": "File not found!"}, status_code=404)
    except AssertionError:
        return JSONResponse(
            content={"error": "There is no power usage data!"}, status_code=500
        )


def main(port: int = 8000):
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
