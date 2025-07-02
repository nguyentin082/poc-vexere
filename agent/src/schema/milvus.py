from pymilvus import (
    connections,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
    utility,
)
import os
import sys
import logging

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
        )
    )
)
from core.config import (
    MILVUS_CLOUD_ENDPOINT,
    MILVUS_CLOUD_TOKEN,
    MILVUS_CLOUD_DB_NAME,
    MILVUS_CLOUD_COLLECTION_NAME,
)


def init_milvus_collection():
    connections.connect(
        uri=MILVUS_CLOUD_ENDPOINT,
        token=MILVUS_CLOUD_TOKEN,
        secure=True,
    )

    if not utility.has_collection(MILVUS_CLOUD_COLLECTION_NAME):
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
            FieldSchema(name="question", dtype=DataType.VARCHAR, max_length=512),
            FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=128),
            FieldSchema(name="answer", dtype=DataType.VARCHAR, max_length=2048),
        ]

        schema = CollectionSchema(fields)
        collection = Collection(name=MILVUS_CLOUD_COLLECTION_NAME, schema=schema)
        print(f"Created collection: {MILVUS_CLOUD_COLLECTION_NAME}")
    else:
        collection = Collection(name=MILVUS_CLOUD_COLLECTION_NAME)
        print(f"Collection already exists: {MILVUS_CLOUD_COLLECTION_NAME}")

    collection.load()
    return collection


if __name__ == "__main__":
    init_milvus_collection()
