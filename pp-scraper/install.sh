#!/bin/bash

INSTALL_DIR="/home/$USER/.powerplot/pp_scraper"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARENT_DIR="$( cd $SCRIPT_DIR && cd .. && pwd )"

set -e
source $(dirname "$SCRIPT_DIR")/install.sh

main() {
    install_python_package "$SCRIPT_DIR" "$INSTALL_DIR"
    install_systemd_services "$SCRIPT_DIR/systemd"
}

main "$@"
