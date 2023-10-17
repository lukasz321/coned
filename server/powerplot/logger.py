import logging
import sys


def get_logger(name: str, log_level: str = "DEBUG"):
    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    class ColoredFormatter(logging.Formatter):
        COLORS = {
            "DEBUG": "\033[94m",  # Blue
            "INFO": "\033[97m",  # White
            "WARNING": "\033[93m",  # Yellow
            "ERROR": "\033[91m",  # Red
            "CRITICAL": "\033[91m",  # Red
        }
        RESET_SEQ = "\033[0m"

        def format(self, record):
            log_message = super(ColoredFormatter, self).format(record)
            if record.levelname in self.COLORS:
                log_message = (
                    f"{self.COLORS[record.levelname]}{log_message}{self.RESET_SEQ}"
                )
            return log_message

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    formatter = ColoredFormatter("%(levelname)s - %(message)s")
    console_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    return logger
