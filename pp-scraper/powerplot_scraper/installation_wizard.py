from timezonefinder import TimezoneFinder
import geocoder

from .provider_coned import ConEd
from .utils import Prompt
from .provider import Provider
from .config import config


def get_energy_provider():
    """ """

    provider = Prompt.choose(
        "Who is your energy provider?", options=[p.value for p in Provider]
    )
    return provider


def get_credentials(provider: Provider):
    """ """

    Prompt.acknowledge(
        f"In order to scrape data, this app requires access to your {provider.value}'s account.\n"
        f"You will be asked to login to {provider.value}'s website. Press ENTER to continue"
    )

    if provider == Provider.CONED:
        try:
            credentials = ConEd.wizard()
            assert credentials
        except Exception:
            print("Something went wrong.")
            exit(1)

    return credentials


def get_geo_location():
    """ """

    g = geocoder.ip("me")
    city = str(g.current_result)
    latitude, longitude = g.latlng

    timezone = TimezoneFinder().timezone_at(lat=latitude, lng=longitude)

    if not Prompt.yes_no(f"Is your current location {city.replace('_', ' ')}?"):
        raise Exception("Flow not yet supported.")

    return {
        "city": city,
        "timezone": timezone,
        "latitude": latitude,
        "longitude": longitude,
    }


def main():
    """ """

    # Get user's geodata for weather and timestamps.
    location = get_geo_location()
    config["location"] = location

    # What electric provider are we setting up for?
    cached_provider = config.get("provider", {}).get("provider_name")
    if not cached_provider or (
        cached_provider
        and Prompt.yes_no(
            f"It appears you've previously set {cached_provider} as your electricity provider. "
            "Has that changed?"
        )
    ):
        provider = get_energy_provider()
    else:
        provider = cached_provider

    if not config.get("provider"):
        config["provider"] = {}

    config["provider"]["provider_name"] = provider

    # Credentials to the energy provider...
    cached_credentials = config.get("provider", {}).get("credentials")
    if (
        not cached_provider
        or not cached_credentials
        or (
            cached_provider
            and Prompt.yes_no(
                f"Your previously configured user/pass are {cached_credentials['username']}/{cached_credentials['password']}. "
                "Would you like to change them?"
            )
        )
    ):
        credentials = get_credentials(Provider(config["provider"]["provider_name"]))
    else:
        credentials = cached_credentials

    config["provider"]["credentials"] = credentials
    config.save()


if __name__ == "__main__":
    main()
