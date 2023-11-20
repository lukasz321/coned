from enum import Enum


class Provider(Enum):
    """
    Supported energy providers.
    """

    CONED = "Con Edison"

    @classmethod
    def values(cls):
        return [v.value for v in cls]

    def __str__(self):
        return self.value
