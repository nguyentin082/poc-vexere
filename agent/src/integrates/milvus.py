import os
import sys
import json
from typing import List, Dict, Any

# Add the parent directory to the path
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
)

try:
    from pymilvus import connections, Collection, utility
    from langchain_openai import OpenAIEmbeddings

    MILVUS_AVAILABLE = True
    EMBEDDINGS_AVAILABLE = True
except ImportError as e:
    MILVUS_AVAILABLE = False
    EMBEDDINGS_AVAILABLE = False
    print(f"Import warning: {e}")

MILVUS_CLOUD_COLLECTION_NAME = "faq_vexere"


class MilvusClient:
    def __init__(self):
        self.collection_name = MILVUS_CLOUD_COLLECTION_NAME
        self.collection = None
        self.connected = False
        self.embeddings = None

        if MILVUS_AVAILABLE:
            self._connect()

        # Initialize embeddings for text to vector conversion
        if EMBEDDINGS_AVAILABLE:
            try:
                self.embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")
                print("OpenAI embeddings initialized successfully")
            except Exception as e:
                print(f"Failed to initialize OpenAI embeddings: {e}")
                self.embeddings = None

    def _connect(self):
        try:
            connections.connect(
                uri=MILVUS_CLOUD_ENDPOINT,
                token=MILVUS_CLOUD_TOKEN,
                secure=True,
            )

            if utility.has_collection(self.collection_name):
                self.collection = Collection(self.collection_name)
                self.collection.load()
                self.connected = True
                print(f"Connected to Milvus collection: {self.collection_name}")
            else:
                print(f"Collection {self.collection_name} not found")

        except Exception as e:
            print(f"Failed to connect to Milvus: {e}")
            self.connected = False

    def search_similar(
        self, query_embedding: List[float], top_k: int = 3
    ) -> List[Dict]:
        """Search for similar documents using vector embedding"""
        if not self.connected or not self.collection:
            print("Milvus not connected or collection not available")
            return []

        try:
            search_params = {"metric_type": "COSINE", "params": {"nprobe": 10}}

            results = self.collection.search(
                data=[query_embedding],
                anns_field="embedding",
                param=search_params,
                limit=top_k,
                output_fields=["question", "category", "answer"],
            )

            documents = []
            for result in results[0]:
                try:
                    question = result.get("question")
                    category = result.get("category")
                    answer = result.get("answer")

                    documents.append(
                        {
                            "question": question or "",
                            "category": category or "",
                            "answer": answer or "",
                            "score": result.score,
                        }
                    )

                except Exception as e:
                    print(f"Error accessing result data: {e}")
                    # Try to_dict method
                    try:
                        result_dict = result.to_dict()
                        print(f"Result dict: {result_dict}")
                        # Extract from dict
                        documents.append(
                            {
                                "question": result_dict.get("question", ""),
                                "category": result_dict.get("category", ""),
                                "answer": result_dict.get("answer", ""),
                                "score": result.score,
                            }
                        )
                    except Exception as e2:
                        print(f"to_dict also failed: {e2}")
                        continue

            print(f"Found {len(documents)} similar documents")
            return documents

        except Exception as e:
            print(f"Error searching in Milvus: {e}")
            return []

    def embed_query(self, query: str) -> List[float]:
        """Convert text query to embedding vector"""
        if not self.embeddings:
            raise Exception("OpenAI embeddings not available")

        try:
            embedding = self.embeddings.embed_query(query)
            print(
                f"Generated embedding for query: '{query}' (dimension: {len(embedding)})"
            )
            return embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            raise e


# Global client instance
milvus_client = MilvusClient()


def get_milvus_client():
    return milvus_client
