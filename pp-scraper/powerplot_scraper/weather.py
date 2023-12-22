from typing import Union
import datetime

import requests
import timezonefinder
import pytz
import geocoder


def get_geo_location():
    g = geocoder.ip("me")
    city = g.current_result
    latitude, longitude = g.latlng

    tf = timezonefinder.TimezoneFinder()

    # Lookup the timezone for the given latitude and longitude
    timezone = tf.timezone_at(lat=latitude, lng=longitude)

    return (latitude, longitude, timezone)


def get_hourly_weather_data(latitude: float, longitude: float, timezone: str):
    print(timezone)
    print(latitude)
    print(longitude)

    base_url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m",
        "timeformat": "unixtime",
        "timezone": timezone,
        "start_date": "2023-10-13",
        "end_date": "2023-12-22",
        "format": "json",
        "temperature_unit": "fahrenheit",
    }

    response = requests.get(base_url, params=params)
    try:
        response.raise_for_status()
    except Exception:
        print(f"Request failed with status code {response.status_code}")
    else:
        data = response.json()
        print(data)

    local_timezone = pytz.timezone(timezone)
    timestamps = data["hourly"]["time"]

    formatted = []
    for timestamp in timestamps:
        # Convert the Unix timestamp to a datetime object
        utc_datetime = datetime.datetime.utcfromtimestamp(timestamp).replace(
            tzinfo=pytz.utc
        )

        # Convert to the local timezone
        local_datetime = utc_datetime.astimezone(local_timezone)

        # Format the local datetime as a string
        formatted_datetime = local_datetime.strftime("%Y-%m-%d %H:%M:%S%z")
        formatted.append(formatted_datetime)

    print(dict(zip(formatted_datetime, data["hourly"]["temperature_2m"])))


# print(list(zip(data["hourly"]["time"], data["hourly"]["temperature_2m"])))

if __name__ == "__main__":
    latitude, longitude, timezone = get_geo_location()
    get_hourly_weather_data(latitude, longitude, timezone)
