
<!-- LOGO -->
<br />
<h1>
<p align="center">
  <img src="img/logo.png" alt="logo" width="600" >
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

<p align="center">
  
![screenshot](img/clip.gif)
</p>                                                                                                                             

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

PowerPlot consists of three components: 
1. the scraper, 
2. the API, 
3. the webapp.

**[1] The scraper periodically retrieves data from your power provider** using the provided credentials, and caches it in the local database. 

For instance, Con Edison offers an insight into one's real-time power usage in 15-minute intervals, *but only for the past day*. The scraper logs into Con Ed's website every few hours, fetches the data, and stores it in a local database, enabling visualization of usage beyond 24 hours.

The scraper is a python3 module which runs under a systemd service named `pp-scraper.service`.


**[2] As the name implies, the API serves the data collected by the scraper to the frontend.**

The api powered by `FastAPI` and `pandas`. It runs as a systemd service called `pp-api.service`.


**[3] The webapp is of course the frontend for the collected data.**

It's built with React and TypeScript and runs as a systemd service named `pp-webapp.service`.

## How It Started
Upon moving to a newly-constructed building in Brooklyn, it didn't take us long to be shocked by our electric bill.

Even though we were gone for most of September, the bill for our 300sqft 2-bedroom apartment clocked in at about $160. Was is the oven? Air-condition that we barely ran? Was our grid hooked up to the neigboring apartment?

The above questions were an inspiration for this project.


# :construction: TODO + FIXME
csv download
settings bar
health bar
webapp wizard
