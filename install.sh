#!/usr/bin/env bash

# This installer drew heavy inspiration and implementation from pihole's installer.
# https://github.com/pi-hole/pi-hole

# TODO:
# - convert all printfs to print

set -e
export PATH+=':/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

GIT_REPO_URL="https://github.com/lukasz321/powerplot.git"
GIT_LOCAL_REPO_DIR="/home/$USER/.powerplot"


is_valid_command() {
    # Checks to see if the given command (passed as a string argument) exists on the system.
    # The function returns 0 (success) if the command exists, and 1 if it doesn't.
    local check_command="$1"
    command -v "${check_command}" >/dev/null 2>&1
}

is_a_repo() {
    # Check if a directory is a git diretory.
    # Return 0 if true.

    local directory="${1}"
    local rc
    
    if [[ -d "${directory}" ]]; then
        pushd "${directory}" &> /dev/null || return 1
        # Use git to check if the directory is a repo...
        git status --short &> /dev/null || rc=$?
    # If the command was not successful,
    else
        # Set a non-zero return code if directory does not exist.
        rc=1
    fi
    popd &> /dev/null || return 1
    # Return the code if one is not set, else return 0.
    return "${rc:-0}"
}

clone_repo() {
    # Set named variables for better readability
    # A function to clone a repo
    local directory="${1}"
    local remoteRepo="${2}"

    print "info" "Cloning ${remoteRepo} into ${directory}."
    
    if [[ -d "${directory}" ]]; then
        print "error" "Unable to clone ${remoteRepo} into ${directory} as the repo already exists!"
        return 1
    fi

    git clone -q --depth 20 "${remoteRepo}" "${directory}" &> /dev/null || return $?

    pushd "${directory}" &> /dev/null || return 1
    
    # Check current branch. If it is trunk, then reset to the latest available tag.
    # In case extra commits have been added after tagging/release (i.e in case of metadata updates/README.MD tweaks)
    curBranch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "${curBranch}" == "trunk" && "$(git describe > /dev/null)" ]]; then
        # If we're calling clone_repo() then it should always be trunk, we may not need to check.
        git reset --hard "$(git describe --abbrev=0 --tags)" > /dev/null || return $?
    fi
    
    print "ok" "OK"
    
    # Data in the repositories is public anyway so we can make it readable by everyone
    # +r to keep executable permission if already set by git)
    chmod -R a+rX "${directory}"
    
    popd &> /dev/null || return 1
    return 0
}

update_repo() {
    # We need to make sure the repos are up-to-date so we can effectively install .
    # lean out the directory if it exists for git to clone into.
    local directory="${1}"
    local curBranch

    pushd "${directory}" &> /dev/null || return 1
    
    local str="Update repo in ${1}"
    print "info" "Updating repo in ${directory}..."
    
    # Stash any local commits as they conflict with our working code
    git stash --all --quiet &> /dev/null || true
    git clean --quiet --force -d > /dev/null || true
    
    # Pull the latest commits
    git pull --no-rebase --quiet &> /dev/null || return $?
    
    # Check current branch. If it is trunk, then reset to the latest available tag.
    curBranch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "${curBranch}" == "trunk" && "$(git describe > /dev/null)" ]]; then
        git reset --hard "$(git describe --abbrev=0 --tags > /dev/null)" > /dev/null || return $?
    fi
    
    print "ok" "OK"
    chmod -R a+rX "${directory}"
    
    popd &> /dev/null || return 1
    return 0
}

# A function that combines the previous git functions to update or clone a repo
getGitFiles() {
    local directory="${1}"
    local remoteRepo="${2}"
    
    # Show the message
    print "info" "Check for existing repository in ${directory}..."
    
    if is_a_repo "${directory}"; then
        update_repo "${directory}" || { print "error" "Could not update local repository."; exit 1; }
    else
        clone_repo "${directory}" "${remoteRepo}" || { print "error" "Could not update local repository."; exit 1; }
    fi
    echo ""
    # Success via one of the two branches, as the commands would exit if they failed.
    return 0
}

clone_or_update_repos() {
    # If the user wants to reconfigure,
    if [[ "${reconfigure}" == true ]]; then
        print "info" "Performing reconfiguration, skipping download of local repos,"
        # Reset the Core repo
        resetRepo ${GIT_LOCAL_REPO_DIR} || \
        { print "error" "Unable to reset ${GIT_LOCAL_REPO_DIR}, exiting installer." 1; \
        exit 1; \
        }
    # Otherwise, a repair is happening
    else
        # so get git files for Core
        getGitFiles ${GIT_LOCAL_REPO_DIR} ${GIT_REPO_URL} || \
        { print "error" "Unable to clone ${GIT_REPO_URL} into ${GIT_LOCAL_REPO_DIR}, unable to continue." 1; \
        exit 1; \
        }
    fi
}

package_manager_detect() {
    if is_valid_command apt-get ; then
        # Set some global variables here
        # We don't set them earlier since the installed package manager might be rpm, so these values would be different
        PKG_MANAGER="sudo apt-get"
        # A variable to store the command used to update the package cache
        UPDATE_PKG_CACHE="${PKG_MANAGER} update"
        # The command we will use to actually install packages
        PKG_INSTALL=("${PKG_MANAGER}" -qq --no-install-recommends install)
        # grep -c will return 1 if there are no matches. This is an acceptable condition, so we OR TRUE to prevent set -e exiting the script.
        PKG_COUNT="${PKG_MANAGER} -s -o Debug::NoLocking=true upgrade | grep -c ^Inst || true"
        # Update package cache
        
        # Packages required to run this install script (stored as an array)
        INSTALLER_DEPS=(git ca-certificates)
        # Packages required to run Pi-hole (stored as an array)
        SYSTEM_DEPS=(python3-dev python3-pip python3-venv npm)
    else
        # we cannot install required packages
        print "error" "No supported package manager found!" 1
        exit
    fi
}

# This function waits for dpkg to unlock, which signals that the previous apt-get command has finished.
test_dpkg_lock() {
    i=0
    print "info" "Waiting for package manager to finish (up to 30 seconds)" 1
    # fuser is a program to show which processes use the named files, sockets, or filesystems
    # So while the lock is held,
    while fuser /var/lib/dpkg/lock >/dev/null 2>&1
    do
        # we wait half a second,
        sleep 0.5
        # increase the iterator,
        ((i=i+1))
        # exit if waiting for more then 30 seconds
        if [[ $i -gt 60 ]]; then
            print "error" "Error: Could not verify package manager finished and released lock." 1
            print "continued"  "Attempt to install packages manually and retry."
            exit 1;
        fi
    done
    # and then report success once dpkg is unlocked.
    return 0
}

install_dependent_packages() {
    # Install packages passed in via argument array
    # No spinner - conflicts with set -e
    declare -a installArray

    # Debian based package install - debconf will download the entire package list
    # so we just create an array of packages not currently installed to cut down on the
    # amount of download traffic.
    # NOTE: We may be able to use this installArray in the future to create a list of package that were
    # installed by us, and remove only the installed packages, and not the entire list.
    if is_valid_command apt-get ; then
        # For each package, check if it's already installed (and if so, don't add it to the installArray)
        for i in "$@"; do
            print "info" "Checking for $i..." 1
            if dpkg-query -W -f='${Status}' "${i}" 2>/dev/null | grep "ok installed" &> /dev/null; then
                print "inline-ok" "Checking for $i..." 1
            else
                print "inline-ok" "Checking for $i (will be installed)." 1
                installArray+=("${i}")
            fi
        done
        # If there's anything to install, install everything in the list.
        if [[ "${#installArray[@]}" -gt 0 ]]; then
            test_dpkg_lock
            # Running apt-get install with minimal output can cause some issues with
            # requiring user input (e.g password for phpmyadmin see #218)
            print "info" "Processing apt-get install(s) for: ${installArray[*]}, please wait..." 1
            printf '%*s\n' "${c}" '' | tr " " -;
            "${PKG_INSTALL[@]}" "${installArray[@]}"
            printf '%*s\n' "${c}" '' | tr " " -;
            return
        fi
        return 0
    fi

    # If there's anything to install, install everything in the list.
    if [[ "${#installArray[@]}" -gt 0 ]]; then
        print "info" "Processing apt-get install(s) for: ${installArray[*]}, please wait..." 1
        printf '%*s\n' "${c}" '' | tr " " -;
        "${PKG_INSTALL[@]}" "${installArray[@]}"
        printf '%*s\n' "${c}" '' | tr " " -;
        return
    fi
    return 0
}

build_and_install_webapp() {
    local source_dir="$1"
    local install_dir="$2"
    
    pushd "${source_dir}" &> /dev/null || return 1

    print "info" "Installing dependencies..." 1
    npm install > /dev/null
    print "inline-ok" "Installing dependencies..." 1
    
    #print "info" "Creating a production build..." 1
    #npm run build > /dev/null
    #print "inline-ok" "Creating a production build..." 1

    print "info" "Installing to $install_dir..." 1
    # Install the .venv directory in target directory.
    rm -rf "$install_dir"
    mkdir -p "$install_dir"
    cp -r "$source_dir"/* "$install_dir"
    #cp -r "$source_dir/build" "$install_dir"
    print "inline-ok" "Installing to $install_dir..." 1

    popd &> /dev/null || return 1
}

install_systemd_services() {
    # Given a path to a directory, install all .service files to /etc/systemd/system
    local services_dir="$1"
    
    for service_file in "${services_dir}"/*.service; do
        if [ -f "$service_file" ]; then
            service_name=$(basename "${service_file}")
            print "info" "Installing ${service_name}..." 1
            sudo install -T -m 0644 "${service_file}" "/etc/systemd/system/${service_name}"
            sudo sed -i 's/insert_target_user/'"$USER"'/g' "/etc/systemd/system/${service_name}"
            sudo systemctl enable "${service_name}"
            sudo systemctl restart "${service_name}"
            print "inline-ok" "Installing ${service_name}..." 1
            sleep 2
            
            local status=$(systemctl is-active ${service_name})
            if [ $status == 'active' ]; then
                print "ok" "${service_name}: ${status}" 1
            else
                print "error" "${service_name}: ${status}" 1
            fi
        fi
    done
}

install_python_package() {
    # Given a path to a python package and a path to target directory, spin up
    # venv, install requirements and install the "built" package into the target dir.

    local package_dir="$1"
    local install_dir="$2"

    pushd "${package_dir}" &> /dev/null || return 1

    print "info" "Spinning up venv..." 1
    python3 -m venv .venv > /dev/null
    print "inline-ok" "Spinning up venv..." 1

    # Activate the virtual environment
    source ".venv/bin/activate"

    print "info" "Installing requirements..." 1
    pip3 install -r requirements.txt > /dev/null
    print "inline-ok" "Installing requirements..." 1

    print "info" "Installing the python3 module..." 1
    pip3 install -e . > /dev/null
    print "inline-ok" "Installing the python3 module..." 1

    # Install the .venv directory in target directory.
    rm -rf "$install_dir"; mkdir -p "$install_dir"
    mv "$package_dir"/.venv/* "$install_dir"

    popd &> /dev/null || return 1
}


print() {
    local type="$1"
    local msg="$2"
    local indent="$3"
    
    COL_NC='\e[0m'
    COL_LIGHT_GREEN='\e[1;32m'
    COL_LIGHT_RED='\e[1;31m'
    
    if [[ $indent == 1 ]]; then
        indent="   "
    elif [[ $indent == 2 ]]; then
        indent="      "
    else 
        indent=""
    fi

    local insert=""
    if [[ $type == "ok" || $type == "inline-ok" ]]; then
        insert="[${COL_LIGHT_GREEN}✓${COL_NC}]"
    elif [[ $type == "error" ]]; then
        insert="[${COL_LIGHT_RED}✗${COL_NC}]"
    elif [[ $type == "info" ]]; then
        insert="[i]"
    elif [[ $type == "continued" ]]; then
        insert="   "
    fi
    
    if [[ ! "$type" == *"inline"* ]]; then
        printf "\n${indent}${insert} ${msg}"
    else
        printf "\\r\\033[K${indent}${insert} ${msg}"
    fi 
}



main() {
    if [[ "${EUID}" -eq 0 && "${SUDO_USER}" ]]; then
        # they are root and all is good
        print "error" "This installer is not meant to run as root if you're not root."
        print "continued" "Run './install.sh' without 'sudo'"
        exit 1
    fi
    
    # Check for supported package managers so that we may install dependencies
    package_manager_detect

    # Install packages used by this installation script
    print "info" "Checking for / installing required dependencies for this install script..."
    install_dependent_packages "${INSTALLER_DEPS[@]}"
    print "ok" "Done\n"

    if [[ "$0" == "bash" ]]; then
        # Download or update the scripts by updating the appropriate git repos
        clone_or_update_repos
        ROOT_DIR=$GIT_LOCAL_REPO_DIR
    else
        ROOT_DIR=$(dirname "$0")
    fi

    # Install packages used by the actual software
    print "info" "Checking for / installing required dependencies for the server..."
    install_dependent_packages "${SYSTEM_DEPS[@]}"
    print "ok" "Done\n"
    
    # Why "sourced":
    # This little hack avoids calling this script in circular loop,
    # as we need to not execute main() on mere function imports in sub-install scripts.
    print "info" "Installing the scraper..."
    source "$ROOT_DIR/pp-scraper/install.sh" "sourced"
    print "ok" "Done\n"

    print "info" "Installing the api..."
    source "$ROOT_DIR/pp-api/install.sh" "sourced"
    print "ok" "Done\n"
    
    print "info" "Installing the webapp..."
    source "$ROOT_DIR/pp-webapp/install.sh" "sourced"
    print "ok" "Done\n"
}

# Check if the script is being sourced or executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" || ( "${0}" == *"bash"* && "${1}" != "sourced" ) ]]; then
    # The script is executed directly, not sourced
    main "$@"
fi
