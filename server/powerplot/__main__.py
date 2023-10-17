import os
import sys
import argparse
import time
import json
import pathlib
import requests
import pandas as pd
from typing import Union

from .providers.coned import ConEd
from .logger import get_logger
from .config import config
from .api import main as run_api

log = get_logger(__name__)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--service",
        action="store_true",
        help="Run this script in loop until interrupted.",
    )
    
    parser.add_argument(
        "--test",
        action="store_true",
        help="Test data scraping.",
    )

    parser.add_argument(
        "--api",
        action="store_true",
        help="",
    )
    parser.add_argument(
        "--install",
        action="store_true",
        help="",
    )

    args = parser.parse_args()
