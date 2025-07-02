import pytest
import sys
import os
import logging

base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
print("Appended path:", base_path)
sys.path.append(base_path)

from src.integrates.milvus import get_client


@pytest.fixture(scope="module")
def milvus_client():
    client = get_client()
    if not client.check_connection():
        pytest.skip("Milvus Cloud connection failed, skipping tests")
    return client


def test_milvus_connection(milvus_client):
    assert (
        milvus_client.check_connection()
    ), "Milvus Cloud connection should be successful"


if __name__ == "__main__":
    pytest.main(["-v", __file__])
