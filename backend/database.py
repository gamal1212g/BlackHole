import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# Global variables for the pooled client
client: AsyncIOMotorClient = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(
            MONGO_URI,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        db = client["blackhole_db"]
        print("INFO: MongoDB Client initialized and explicitly targeting 'blackhole_db'.")
    except Exception as e:
        print(f"CRITICAL: Could not initialize MongoDB client: {e}")
        raise e

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("INFO: MongoDB connection pool closed.")

def get_database():
    global client, db
    # Fallback initialization just in case lifespan didn't fire properly
    if client is None or db is None:
        print("WARNING: Database accessed before lifespan init. Initializing synchronously.")
        client = AsyncIOMotorClient(MONGO_URI)
        db = client["blackhole_db"]
    return db
