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

# MILVUS Cloud Configuration
MILVUS_CLOUD_ENDPOINT = os.getenv("MILVUS_CLOUD_ENDPOINT")
MILVUS_CLOUD_TOKEN = os.getenv("MILVUS_CLOUD_TOKEN")
MILVUS_CLOUD_DB_NAME = os.getenv("MILVUS_CLOUD_DB_NAME")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

BACKEND_URL = os.getenv("BACKEND_URL")
