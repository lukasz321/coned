#!/usr/bin/env python
import os
from setuptools import setup, find_packages

NAME = "powerplot"

here = os.path.abspath(os.path.dirname(__file__))

about = {}
with open(os.path.join(here, NAME, "__version__.py")) as f:
    exec(f.read(), about)

setup(
    name=NAME,
    version=about["__version__"],
    include_package_data=True,
    install_requires=[],
    packages=find_packages(),
)
