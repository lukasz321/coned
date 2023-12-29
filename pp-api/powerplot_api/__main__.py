import os
import json
import csv
import time
import signal
import threading

import uvicorn
from fastapi import FastAPI, Path
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .power_data import PowerData
from .data_handler import DataHandler, DB_FILE_PATH
from .utils import systemd_service_is_active

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # You can specify the HTTP methods you want to allow
    allow_headers=["*"],  # You can specify the HTTP headers you want to allow
)
# Add the GZipMiddleware to enable response compression
# app.add_middleware(GZipMiddleware, minimum_size=1000)  # Adjust the minimum size as needed
# automatically unpack if Content-Encoding: gzip

data_handler = DataHandler()


@app.get("/")
async def root():
    try:
        data = data_handler.reload()
    except FileNotFoundError:
        return JSONResponse(content={"error": "File not found!"}, status_code=404)
    except AssertionError:
        return JSONResponse(
            content={"error": "There is no power usage data!"}, status_code=500
        )

    # We want to inform user on how current the data is -
    db_last_modified = time.strftime(
        "%B %d, %Y %I:%M:%S %p", time.localtime(data_handler.last_modified)
    )
    db_last_modified_seconds_ago = int(time.time() - data_handler.last_modified)

    # Some health indicators @ systemd services -
    services_health = {}
    services = ("pp-api", "pp-webapp", "pp-scraper")
    for service in services:
        services_health[service] = systemd_service_is_active(service)

    content = {
        "last_updated": db_last_modified,
        "last_updated_seconds_ago": db_last_modified_seconds_ago,
        "systemd": services_health,
        "projected_bill": data.bill_breakdown(),
        "base_usage": data.base_usage(),
        "data": {
            "hourly": PowerData.to_json(data.hourly()),
            "monthly": PowerData.to_json(data.monthly()),
            "daily": PowerData.to_json(data.daily()),
        },
        "statistics_and_trends": {
            "day_breakdown": {
                "past_24h": data.day_breakdown(last_num_hours=24),
                "past_48h": data.day_breakdown(last_num_hours=48),
                "past_7d": data.day_breakdown(last_num_hours=(24 * 7)),
            },
            "hourly_mean_trend": data.hourly_mean(),
        },
    }

    with open(f"{DB_FILE_PATH.parent}/powerplot.json", "w") as f:
        json.dump(content, f, indent=4)

    return JSONResponse(
        content=content,
        status_code=200,
    )


def shutdown_server():
    print("Shutting down the server...")
    uvicorn.server.should_exit = True


def main(port: int = 8000):
    signal.signal(signal.SIGINT, lambda signum, frame: shutdown_server())

    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main(port=8181)
