import os
from dotenv import load_dotenv

load_dotenv(override=True)


def get_env_variable(name):
    # Reloads environment variables from .env each time it's called
    load_dotenv(".env")

    value = os.getenv(name)
    if value is None:
        raise EnvironmentError(f"Environment variable {name} not found in .env file")
    return value


MONGODB_KEY = os.getenv("MONGODB_KEY")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")
