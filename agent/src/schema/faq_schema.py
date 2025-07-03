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

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.config import (
    MILVUS_CLOUD_ENDPOINT,
    MILVUS_CLOUD_TOKEN,
)


def init_milvus_collection(collection_name: str) -> Collection:
    connections.connect(
        uri=MILVUS_CLOUD_ENDPOINT,
        token=MILVUS_CLOUD_TOKEN,
        secure=True,
    )

    index_params = {
        "metric_type": "COSINE",
        "index_type": "IVF_FLAT",
        "params": {"nlist": 128},
    }

    if not utility.has_collection(collection_name):
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
            FieldSchema(name="question", dtype=DataType.VARCHAR, max_length=512),
            FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=128),
            FieldSchema(name="answer", dtype=DataType.VARCHAR, max_length=2048),
        ]
        schema = CollectionSchema(fields)
        collection = Collection(name=collection_name, schema=schema)
        print(f"[✔] Created collection: {collection_name}")
    else:
        collection = Collection(name=collection_name)
        print(f"[ℹ] Collection already exists: {collection_name}")

    try:
        if not collection.has_index():
            collection.create_index(field_name="embedding", index_params=index_params)
            print(f"[✔] Created index on embedding field: {collection_name}")
        else:
            print(f"[ℹ] Index already exists for: {collection_name}")
    except Exception as e:
        print(f"[✘] Error while creating index: {e}")

    collection.load()
    return collection


if __name__ == "__main__":
    init_milvus_collection(collection_name="faq_vexere")
