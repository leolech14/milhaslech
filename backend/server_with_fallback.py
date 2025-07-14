from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Programas de Milhas Família Lech API", version="1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to connect to MongoDB, fallback to in-memory storage
try:
    from pymongo import MongoClient
    mongo_client = MongoClient(os.getenv("MONGO_URL"))
    db = mongo_client[os.getenv("DB_NAME")]
    companies_collection = db.companies
    members_collection = db.members
    global_log_collection = db.global_log
    postits_collection = db.postits
    print("Connected to MongoDB")
except:
    print("MongoDB connection failed, using in-memory storage")
    # In-memory storage fallback
    companies_data = {}
    members_data = {}
    logs_data = []
    postits_data = {}

# Import the rest of the server code
from backend.server import *