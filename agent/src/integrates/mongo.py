from core.config import MONGODB_KEY, MONGODB_DB_NAME
from pymongo import MongoClient

class MongoDBClient:
    def __init__(self, uri, db_name):
        self.client = MongoClient(uri, tlsAllowInvalidCertificates=True)
        self.db = self.client[db_name]
    def insert_one(self, collection_name, document):
        collection = self.db[collection_name]
        result = collection.insert_one(document)
        return result

    def find_one(self, collection_name, query):
        collection = self.db[collection_name]
        return collection.find_one(query)
    def find(self, collection_name, query):
        collection = self.db[collection_name]
        return collection.find(query)
    def find_all(self, collection_name):
        collection = self.db[collection_name]
        return collection.find()
    def update_one(self, collection_name, query, update_data):
        collection = self.db[collection_name]
        return collection.update_one(query, update_data)
    def delete_one(self, collection_name, query):
        collection = self.db[collection_name]
        return collection.delete_one(query)
    def close(self):
        self.client.close()

client = MongoDBClient(uri=MONGODB_KEY, db_name=MONGODB_DB_NAME)

def get_client():
    return client