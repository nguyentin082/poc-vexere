import os
from pymilvus import (
    connections,
    Collection,
    FieldSchema,
    CollectionSchema,
    DataType,
    utility,
)


from src.core.config import (
    MILVUS_CLOUD_ENDPOINT,
    MILVUS_CLOUD_TOKEN,
    MILVUS_CLOUD_DB_NAME,
    MILVUS_CLOUD_COLLECTION_NAME,
)
import logging

logger = logging.getLogger(__name__)


class MilvusCloudClient:
    def __init__(self, uri, api_key, db_name, collection_name):
        self.connection_alias = "default"
        self.uri = uri
        self.api_key = api_key
        self.db_name = db_name
        self.collection_name = collection_name

        print(f"Connecting to Milvus Cloud via: {uri}")
        self.connect()

    def connect(self):
        try:
            connections.connect(
                alias=self.connection_alias,
                uri=self.uri,
                token=self.api_key,
                db_name=self.db_name,
            )
            print(f"Connected to Milvus Cloud at {self.uri} with DB: {self.db_name}")
            return True
        except Exception as e:
            print(f"Error when connect Milvus Cloud: {e}")
            return False

    def check_connection(self):
        try:
            collections = utility.list_collections(using=self.connection_alias)
            print(f"Successfully connected. Found {len(collections)} collections")
            return True
        except Exception as e:
            print(f"Error when checking connection to Milvus Cloud: {e}")
            return False

    def close(self):
        try:
            connections.disconnect(self.connection_alias)
            print("Closed connection to Milvus Cloud")
        except Exception as e:
            print(f"Error when closing the connection to Milvus Cloud: {e}")

    def get_collection_info(self):
        """Get collection schema information"""
        try:
            collection = Collection(self.collection_name, using=self.connection_alias)
            schema = collection.schema
            print(f"Collection {self.collection_name} schema:")
            for field in schema.fields:
                print(
                    f"  Field: {field.name}, Type: {field.dtype}, Params: {field.params}"
                )
            return schema
        except Exception as e:
            print(f"Error getting collection info for {self.collection_name}: {e}")
            return None


# Initialize Zilliz Cloud client
client = MilvusCloudClient(
    uri=MILVUS_CLOUD_ENDPOINT,
    api_key=MILVUS_CLOUD_TOKEN,
    db_name=MILVUS_CLOUD_DB_NAME,
    collection_name=MILVUS_CLOUD_COLLECTION_NAME,
)


def get_client():
    return client
