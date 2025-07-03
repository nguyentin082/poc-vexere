# TODO: Store faq.json data to Milvus Zilliz Cloud vector store

import json
from langchain_core.documents import Document
from langchain_community.vectorstores import Milvus
from langchain_community.document_loaders import TextLoader
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter
import sys
import os
import logging


sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
        )
    )
)

from agent.src.schema.faq_schema import init_milvus_collection
from core.config import (
    MILVUS_CLOUD_ENDPOINT,
    MILVUS_CLOUD_TOKEN,
    MILVUS_CLOUD_DB_NAME,
)

COLLECTION_NAME = "faq_vexere"


def store_faq_to_milvus(data_path: str = "src/mock/faq.json"):
    # Initialize Milvus collection
    init_milvus_collection(collection_name=COLLECTION_NAME)

    with open(data_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    docs = [
        Document(
            page_content=item["answer"],
            metadata={"question": item["question"], "category": item["category"]},
        )
        for item in raw_data
    ]

    embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")

    # Specify the correct field names that match your schema
    vector_store = Milvus.from_documents(
        documents=docs,
        embedding=embeddings,
        connection_args={
            "uri": MILVUS_CLOUD_ENDPOINT,
            "token": MILVUS_CLOUD_TOKEN,
            "db_name": MILVUS_CLOUD_DB_NAME,
        },
        collection_name=COLLECTION_NAME,
        vector_field="embedding",
        text_field="answer",
    )

    print(
        f"Stored {len(docs)} documents to Milvus Cloud collection: {vector_store.collection_name}"
    )


if __name__ == "__main__":
    store_faq_to_milvus()
