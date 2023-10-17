#!/usr/bin/env bash
# curl -sSL https://install.pi-hole.net | bash

set -e
export PATH+=':/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

GIT_REPO_URL="https://github.com/lukasz321/powerplot.git"
GIT_LOCAL_REPO_DIR="/home/$USER/.powerplot"

########################
COL_NC='\e[0m' # No Color
COL_LIGHT_GREEN='\e[1;32m'
COL_LIGHT_RED='\e[1;31m'
TICK="[${COL_LIGHT_GREEN}✓${COL_NC}]"
CROSS="[${COL_LIGHT_RED}✗${COL_NC}]"
INFO="[i]"
# shellcheck disable=SC2034
DONE="${COL_LIGHT_GREEN} done!${COL_NC}"
OVER="\\r\\033[K"

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
    git stash --all --quiet &> /dev/null || true # Okay for stash failure
    git clean --quiet --force -d || true # Okay for already clean directory
    
    # Pull the latest commits
    git pull --no-rebase --quiet &> /dev/null || return $?
    
    # Check current branch. If it is trunk, then reset to the latest available tag.
    curBranch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "${curBranch}" == "trunk" && "$(git describe > /dev/null)" ]]; then
        git reset --hard "$(git describe --abbrev=0 --tags)" > /dev/null || return $?
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
    
    local str="Check for existing repository in ${1}"
    # Show the message
    printf "  %b %s..." "${INFO}" "${str}"
    
    if is_a_repo "${directory}"; then
        # Show that we're checking it
        printf "%b  %b %s\\n" "${OVER}" "${TICK}" "${str}"
        # Update the repo, returning an error message on failure
        update_repo "${directory}" || { printf "\\n  %b: Could not update local repository. Contact support.%b\\n" "${COL_LIGHT_RED}" "${COL_NC}"; exit 1; }
    # If it's not a .git repo,
    else
        # Show an error
        printf "%b  %b %s\\n" "${OVER}" "${CROSS}" "${str}"
        # Attempt to make the repository, showing an error on failure
        clone_repo "${directory}" "${remoteRepo}" || { printf "\\n  %bError: Could not update local repository. Contact support.%b\\n" "${COL_LIGHT_RED}" "${COL_NC}"; exit 1; }
    fi
    echo ""
    # Success via one of the two branches, as the commands would exit if they failed.
    return 0
}

clone_or_update_repos() {
    # If the user wants to reconfigure,
    if [[ "${reconfigure}" == true ]]; then
        printf "  %b Performing reconfiguration, skipping download of local repos\\n" "${INFO}"
        # Reset the Core repo
        resetRepo ${GIT_LOCAL_REPO_DIR} || \
        { printf "  %b Unable to reset %s, exiting installer%b\\n" "${COL_LIGHT_RED}" "${GIT_LOCAL_REPO_DIR}" "${COL_NC}"; \
        exit 1; \
        }
    # Otherwise, a repair is happening
    else
        # so get git files for Core
        getGitFiles ${GIT_LOCAL_REPO_DIR} ${GIT_REPO_URL} || \
        { printf "  %b Unable to clone %s into %s, unable to continue%b\\n" "${COL_LIGHT_RED}" "${piholeGitUrl}" "${GIT_LOCAL_REPO_DIR}" "${COL_NC}"; \
        exit 1; \
        }
    fi
}

# Start/Restart service passed in as argument
restart_systemd_service() {
    # Local, named variables
    local str="Restarting ${1} service"
    printf "  %b %s..." "${INFO}" "${str}"
    # If systemctl exists,
    if is_valid_command systemctl ; then
        # use that to restart the service
        systemctl restart "${1}" &> /dev/null
    else
        # Otherwise, fall back to the service command
        service "${1}" restart &> /dev/null
    fi
    printf "%b  %b %s...\\n" "${OVER}" "${TICK}" "${str}"
}

# Enable service so that it will start with next reboot
enable_systemd_service() {
    # Local, named variables
    local str="Enabling ${1} service to start on reboot"
    printf "  %b %s..." "${INFO}" "${str}"
    # If systemctl exists,
    if is_valid_command systemctl ; then
        # use that to enable the service
        systemctl enable "${1}" &> /dev/null
    else
        #  Otherwise, use update-rc.d to accomplish this
        update-rc.d "${1}" defaults &> /dev/null
    fi
    printf "%b  %b %s...\\n" "${OVER}" "${TICK}" "${str}"
}

# Disable service so that it will not with next reboot
disable_systemd_service() {
    # Local, named variables
    local str="Disabling ${1} service"
    printf "  %b %s..." "${INFO}" "${str}"
    # If systemctl exists,
    if is_valid_command systemctl ; then
        systemctl disable "${1}" &> /dev/null
    else
        # Otherwise, use update-rc.d to accomplish this
        update-rc.d "${1}" disable &> /dev/null
    fi
    printf "%b  %b %s...\\n" "${OVER}" "${TICK}" "${str}"
}

check_systemd_service_active() {
    if is_valid_command systemctl ; then
        systemctl is-enabled "${1}" &> /dev/null
    else
        service "${1}" status &> /dev/null
    fi
}

update_package_cache() {
    # Update package cache on apt based OSes. Do this every time since
    # it's quick and packages can be updated at any time.

    # Local, named variables
    local str="Update local cache of available packages"
    printf "  %b %s..." "${INFO}" "${str}"
    # Create a command from the package cache variable
    if eval "${UPDATE_PKG_CACHE}" &> /dev/null; then
        printf "%b  %b %s\\n" "${OVER}" "${TICK}" "${str}"
    else
        # Otherwise, show an error and exit

        # In case we used apt-get and apt is also available, we use this as recommendation as we have seen it
        # gives more user-friendly (interactive) advice
        if [[ ${PKG_MANAGER} == "apt-get" ]] && is_valid_command apt ; then
            UPDATE_PKG_CACHE="apt update"
        fi
        printf "%b  %b %s\\n" "${OVER}" "${CROSS}" "${str}"
        printf "  %b Error: Unable to update package cache. Please try \"%s\"%b\\n" "${COL_LIGHT_RED}" "sudo ${UPDATE_PKG_CACHE}" "${COL_NC}"
        return 1
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
        
        #update_package_cache || exit 1
        
        # Packages required to run this install script (stored as an array)
        INSTALLER_DEPS=(git ca-certificates)
        # Packages required to run Pi-hole (stored as an array)
        SYSTEM_DEPS=(python3-dev python3-pip python3-venv npm)
    else
        # we cannot install required packages
        printf "  %b No supported package manager found\\n" "${CROSS}"
        # so exit the installer
        exit
    fi
}

# This function waits for dpkg to unlock, which signals that the previous apt-get command has finished.
test_dpkg_lock() {
    i=0
    printf "  %b Waiting for package manager to finish (up to 30 seconds)\\n" "${INFO}"
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
            printf "  %b %bError: Could not verify package manager finished and released lock. %b\\n" "${CROSS}" "${COL_LIGHT_RED}" "${COL_NC}"
            printf "       Attempt to install packages manually and retry.\\n"
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
            printf "  %b Checking for %s..." "${INFO}" "${i}"
            if dpkg-query -W -f='${Status}' "${i}" 2>/dev/null | grep "ok installed" &> /dev/null; then
                printf "%b  %b Checking for %s\\n" "${OVER}" "${TICK}" "${i}"
            else
                printf "%b  %b Checking for %s (will be installed)\\n" "${OVER}" "${INFO}" "${i}"
                installArray+=("${i}")
            fi
        done
        # If there's anything to install, install everything in the list.
        if [[ "${#installArray[@]}" -gt 0 ]]; then
            test_dpkg_lock
            # Running apt-get install with minimal output can cause some issues with
            # requiring user input (e.g password for phpmyadmin see #218)
            printf "  %b Processing %s install(s) for: %s, please wait...\\n" "${INFO}" "${PKG_MANAGER}" "${installArray[*]}"
            printf '%*s\n' "${c}" '' | tr " " -;
            "${PKG_INSTALL[@]}" "${installArray[@]}"
            printf '%*s\n' "${c}" '' | tr " " -;
            return
        fi
        printf "\\n"
        return 0
    fi

    # If there's anything to install, install everything in the list.
    if [[ "${#installArray[@]}" -gt 0 ]]; then
        printf "  %b Processing %s install(s) for: %s, please wait...\\n" "${INFO}" "${PKG_MANAGER}" "${installArray[*]}"
        printf '%*s\n' "${c}" '' | tr " " -;
        "${PKG_INSTALL[@]}" "${installArray[@]}"
        printf '%*s\n' "${c}" '' | tr " " -;
        return
    fi
    printf "\\n"
    return 0
}

install_python_module() {
    local python_dir="${GIT_LOCAL_REPO_DIR}/server/"
    
    pushd "${python_dir}" &> /dev/null || return 1
    
    print "info" "Spinning up venv..."
    python3 -m venv .venv > /dev/null
    print "ok" "Spinning up venv...\n"

    # Activate the virtual environment
    source ".venv/bin/activate"

    print "info" "Installing requirements...\n"
    pip3 install -r requirements.txt

    print "info" "Installing the module...\n"
    pip3 install -e . > /dev/null
    printf "  %b OK\\n" "${TICK}" "${OVER}"

    printf "  %b Taking you to the installation wizard...\\n" "${INFO}"
    python3 -m powerplot.installation_wizard
    
    popd &> /dev/null || return 1
}

install_systemd_services() {
    local services_dir="${GIT_LOCAL_REPO_DIR}/systemd/"
    
    printf "  %b Installing systemd services...\\n" "${INFO}"

    # Iterate over all files ending with *.service in the services_dir directory
    for service_file in "${services_dir}"/*.service; do
        if [ -f "$service_file" ]; then
            # Extract the service name from the file name
            service_name=$(basename "${service_file}")
            printf "  %b Installing ${service_name}...\\n" "${INFO}"
            sudo install -T -m 0644 "${service_file}" "/etc/systemd/system/${service_name}"
            sudo sed -i 's/insert_target_user/'"$USER"'/g' "/etc/systemd/system/${service_name}"

            sudo systemctl enable "${service_name}"
            sudo systemctl restart "${service_name}"
        fi
    done

    # Reload systemd daemon
    sudo systemctl daemon-reload
}

xx() {
    # If the user's id is zero,
    if [[ "${EUID}" -eq 0 ]]; then
        # they are root and all is good
        printf "  %b %s\\n" "${TICK}" "${str}"
    else
        # Otherwise, they do not have enough privileges, so let the user know
        printf "  %b %s\\n" "${INFO}" "${str}"
        printf "  %b %bScript called with non-root privileges%b\\n" "${INFO}" "${COL_LIGHT_RED}" "${COL_NC}"
        printf "      PowerPlot requires elevated privileges to install and run.\\n"
        printf "      Please check the installer for any concerns regarding this requirement.\\n"
        printf "  %b Sudo utility check" "${INFO}"

        # If the sudo command exists, try rerunning as admin
        if is_valid_command sudo ; then
            printf "%b  %b Sudo utility check\\n" "${OVER}"  "${TICK}"

            if [[ "$0" == "bash" ]]; then
                exec curl -sSL https://raw.githubusercontent.com/lukasz321/powerplot/trunk/install.sh | bash "$@"
            else
                exec "$0" "$@"
            fi

            exit $?
        else
            # Otherwise, tell the user they need to run the script as root, and bail
            printf "%b  %b Sudo utility check\\n" "${OVER}" "${CROSS}"
            printf "  %b Sudo is needed for the Web Interface to run pihole commands\\n\\n" "${INFO}"
            printf "  %b %bPlease re-run this installer as root${COL_NC}\\n" "${INFO}" "${COL_LIGHT_RED}"
            exit 1
        fi
    fi
}

print() {
    TICK="[${COL_LIGHT_GREEN}✓${COL_NC}]"
    CROSS="[${COL_LIGHT_RED}✗${COL_NC}]"
    INFO="[i]"
    # shellcheck disable=SC2034
    DONE="${COL_LIGHT_GREEN} done!${COL_NC}"
    
    if [[ $1 == "ok" ]]; then
        printf "${TICK} ${2}\n"
    elif [[ $1 == "error" ]]; then
        printf "${CROSS} ${2}\n"
    elif [[ $1 == "info" ]]; then
        printf "${INFO} ${2}\n"
    elif [[ $1 == "continued" ]]; then
        printf "   ${2}\n"
    else
        echo "Invalid argument: $1. Please provide 'info', 'error', or 'ok'."
    fi
}

main() {
    if [[ "${EUID}" -eq 0 && "${SUDO_USER}" ]]; then
        # they are root and all is good
        print "error" "This installer is not meant to run as root if you're not root."
        exit 1
    fi
    
    # Check for supported package managers so that we may install dependencies
    package_manager_detect

    # Install packages used by this installation script
    print "info" "Checking for / installing required dependencies for this install script..."
    install_dependent_packages "${INSTALLER_DEPS[@]}"

    # Download or update the scripts by updating the appropriate git repos
    clone_or_update_repos

    # Install packages used by the actual software
    print "info" "Checking for / installing required dependencies for this install script..."
    install_dependent_packages "${SYSTEM_DEPS[@]}"

    install_python_module
    
    install_systemd_services
}


# allow to source this script without running it
if [[ "${SKIP_INSTALL}" != true ]] ; then
    main "$@"
fi


