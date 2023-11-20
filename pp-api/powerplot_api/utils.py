import subprocess

def systemd_service_is_active(service_name: str) -> bool:
    try:
        cmd = f"systemctl is-active --quiet {service_name}"
        subprocess.run(cmd, shell=True, check=True)
        return True
    except subprocess.CalledProcessError:
        return False

if __name__ == "__main__":
    print(systemd_service_is_active("pp-webapp"))
    print(systemd_service_is_active("pp-api"))
    print(systemd_service_is_active("pp-scraper"))
    print(systemd_service_is_active("xxx"))

