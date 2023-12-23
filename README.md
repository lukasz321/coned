
<!-- LOGO -->
<br />
<h1>
<p align="center">
  <img src="img/logo-github.png" alt="logo" width="600" >
</h1>
  <p align="center">
    Designed to help you visualize and understand your electric energy consumption.
    <br />
    </p>
</p>
<p align="center">
  <a href="#supported-power-providers">Supported Providers</a> •
  <a href="#installation">Installation</a> •
  <a href="#how-it-works">Under The Hood</a> •
  <a href="#how-it-started">About The Project</a>
</p>  

<h2 align="center">
  <span style="font-size: larger;">https://powerplot.app</span>
</h2>

## Supported Power Providers
| Provider | Area                                              |
|------------|-------------------------------------------------|
| Con Edison   | NYC Metro |

If you're interested in writing an integration with your provider, reach out!

## Installation
To get started with PowerPlot, you'll need:

- **A Linux-powered device**: such as Raspberry Pi, Pi Nano, ODROID, or similar devices, preferably running 24/7. Alternatively, you can install this app on your Linux-powered daily driver.
- **An account with your power provider**: you'll require login credentials for your power provider's website, which you likely have if you pay the bill.


One-Step Automated Install
```sh
curl -sSL 'https://raw.githubusercontent.com/lukasz321/powerplot/trunk/install.sh' | bash
```

Alternative Install Methods
```sh
git clone git@github.com:lukasz321/powerplot
cd powerplot && install.sh
```

## How It Works
PowerPlot comprises three main parts: the scraper, the API, and the webapp.

**Scraper**: This component regularly fetches data from your power provider using the provided credentials, storing it in a local database. For instance, it accesses Con Edison's website every few hours to capture real-time power usage data at 15-minute intervals beyond the past 24 hours. The scraper operates as a Python3 module under the pp-scraper.service.

**API**: The API, built with FastAPI and pandas, serves the collected data to the frontend. It operates as a systemd service named pp-api.service.

**Webapp**: The frontend, React + TS, visualizes the collected data. It operates under the pp-webapp.service systemd service.

## Project Inspiration
The project originated from a surprise electric bill in our newly-constructed Brooklyn apartment. Despite our absence for most of September, our 300sqft 2-bedroom apartment incurred a hefty $160 bill. This sparked questions about our appliances' usage: was it the oven, the rarely used air conditioning, or a connection issue with a neighboring apartment?

Upon analyzing the scraped data, we discovered that our AC units were disproportionately powerful for our apartment's size. According to the data, running all three units 24/7 would have resulted in a staggering $600 bill.


## TODO + FIXME
- csv download
- settings bar
- health bar
- webapp wizard
- tooltip on daily line chart needs attn
