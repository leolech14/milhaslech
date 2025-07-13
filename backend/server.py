from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel
from typing import List, Optional
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

# MongoDB connection
mongo_client = MongoClient(os.getenv("MONGO_URL"))
db = mongo_client[os.getenv("DB_NAME")]

# Collections
companies_collection = db.companies
members_collection = db.members
balance_history_collection = db.balance_history

# Pydantic models
class Company(BaseModel):
    id: str
    name: str
    color: str
    logo: Optional[str] = None
    max_members: int = 4
    points_name: str  # "milhas", "pontos", etc.

class Member(BaseModel):
    id: str
    company_id: str
    owner_name: str
    loyalty_number: str
    current_balance: int = 0
    elite_tier: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    last_updated: datetime

class BalanceHistory(BaseModel):
    id: str
    member_id: str
    balance: int
    previous_balance: int
    change: int
    elite_tier: Optional[str] = None
    notes: Optional[str] = None
    updated_at: datetime
    updated_by: str = "manual"

class MemberCreate(BaseModel):
    company_id: str
    owner_name: str
    loyalty_number: str
    current_balance: int = 0
    elite_tier: Optional[str] = None
    notes: Optional[str] = None

class MemberUpdate(BaseModel):
    owner_name: Optional[str] = None
    loyalty_number: Optional[str] = None
    current_balance: Optional[int] = None
    elite_tier: Optional[str] = None
    notes: Optional[str] = None

class CompanyCreate(BaseModel):
    name: str
    color: str
    logo: Optional[str] = None
    max_members: int = 4
    points_name: str = "pontos"

# Initialize default companies and family members
async def init_default_data():
    default_companies = [
        {
            "id": "latam",
            "name": "LATAM Pass",
            "color": "#d31b2c",
            "max_members": 4,
            "points_name": "milhas"
        },
        {
            "id": "smiles",
            "name": "Smiles",
            "color": "#ff6600",
            "max_members": 4,
            "points_name": "milhas"
        },
        {
            "id": "azul",
            "name": "TudoAzul",
            "color": "#0072ce",
            "max_members": 4,
            "points_name": "pontos"
        }
    ]
    
    family_members = ["Osvandré", "Marilise", "Graciela", "Leonardo"]
    
    # Create companies
    for company in default_companies:
        existing = companies_collection.find_one({"id": company["id"]})
        if not existing:
            companies_collection.insert_one(company)
    
    # Create family members for each company
    for company in default_companies:
        for member_name in family_members:
            existing_member = members_collection.find_one({
                "company_id": company["id"], 
                "owner_name": member_name
            })
            
            if not existing_member:
                member_id = str(uuid.uuid4())
                now = datetime.utcnow()
                
                member_data = {
                    "id": member_id,
                    "company_id": company["id"],
                    "owner_name": member_name,
                    "loyalty_number": "",  # Empty for user to fill
                    "current_balance": 0,
                    "elite_tier": "",
                    "notes": "",
                    "created_at": now,
                    "last_updated": now
                }
                
                members_collection.insert_one(member_data)

# Startup event
@app.on_event("startup")
async def startup_event():
    await init_default_data()

# Company endpoints
@app.get("/api/companies", response_model=List[Company])
async def get_companies():
    companies = list(companies_collection.find({}, {"_id": 0}))
    return companies

@app.post("/api/companies", response_model=Company)
async def create_company(company: CompanyCreate):
    company_id = str(uuid.uuid4())
    company_data = {
        "id": company_id,
        "name": company.name,
        "color": company.color,
        "logo": company.logo,
        "max_members": company.max_members,
        "points_name": company.points_name
    }
    
    companies_collection.insert_one(company_data)
    return Company(**company_data)

@app.get("/api/companies/{company_id}", response_model=Company)
async def get_company(company_id: str):
    company = companies_collection.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Programa não encontrado")
    return Company(**company)

# Member endpoints
@app.get("/api/members", response_model=List[Member])
async def get_members(company_id: Optional[str] = None):
    filter_query = {}
    if company_id:
        filter_query["company_id"] = company_id
    
    members = list(members_collection.find(filter_query, {"_id": 0}))
    return members

@app.post("/api/members", response_model=Member)
async def create_member(member: MemberCreate):
    # Check if company exists
    company = companies_collection.find_one({"id": member.company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Programa não encontrado")
    
    # Check member limit
    current_members = members_collection.count_documents({"company_id": member.company_id})
    if current_members >= company["max_members"]:
        raise HTTPException(status_code=400, detail=f"Máximo de {company['max_members']} contas permitidas para este programa")
    
    # Create member
    member_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    member_data = {
        "id": member_id,
        "company_id": member.company_id,
        "owner_name": member.owner_name,
        "loyalty_number": member.loyalty_number,
        "current_balance": member.current_balance,
        "elite_tier": member.elite_tier,
        "notes": member.notes,
        "created_at": now,
        "last_updated": now
    }
    
    members_collection.insert_one(member_data)
    
    # Create initial balance history
    if member.current_balance > 0:
        history_data = {
            "id": str(uuid.uuid4()),
            "member_id": member_id,
            "balance": member.current_balance,
            "previous_balance": 0,
            "change": member.current_balance,
            "elite_tier": member.elite_tier,
            "notes": "Saldo inicial",
            "updated_at": now,
            "updated_by": "manual"
        }
        balance_history_collection.insert_one(history_data)
    
    return Member(**member_data)

@app.get("/api/members/{member_id}", response_model=Member)
async def get_member(member_id: str):
    member = members_collection.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return Member(**member)

@app.put("/api/members/{member_id}", response_model=Member)
async def update_member(member_id: str, member_update: MemberUpdate):
    member = members_collection.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    # Prepare update data
    update_data = {}
    if member_update.owner_name is not None:
        update_data["owner_name"] = member_update.owner_name
    if member_update.loyalty_number is not None:
        update_data["loyalty_number"] = member_update.loyalty_number
    if member_update.elite_tier is not None:
        update_data["elite_tier"] = member_update.elite_tier
    if member_update.notes is not None:
        update_data["notes"] = member_update.notes
    
    # Handle balance update
    if member_update.current_balance is not None:
        previous_balance = member["current_balance"]
        new_balance = member_update.current_balance
        update_data["current_balance"] = new_balance
        
        # Create balance history entry
        if new_balance != previous_balance:
            history_data = {
                "id": str(uuid.uuid4()),
                "member_id": member_id,
                "balance": new_balance,
                "previous_balance": previous_balance,
                "change": new_balance - previous_balance,
                "elite_tier": member_update.elite_tier or member["elite_tier"],
                "notes": member_update.notes or "Atualização manual",
                "updated_at": datetime.utcnow(),
                "updated_by": "manual"
            }
            balance_history_collection.insert_one(history_data)
    
    update_data["last_updated"] = datetime.utcnow()
    
    # Update member
    members_collection.update_one(
        {"id": member_id},
        {"$set": update_data}
    )
    
    # Return updated member
    updated_member = members_collection.find_one({"id": member_id}, {"_id": 0})
    return Member(**updated_member)

@app.delete("/api/members/{member_id}")
async def delete_member(member_id: str):
    result = members_collection.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    # Also delete balance history
    balance_history_collection.delete_many({"member_id": member_id})
    
    return {"message": "Conta excluída com sucesso"}

# Balance history endpoints
@app.get("/api/members/{member_id}/history", response_model=List[BalanceHistory])
async def get_member_history(member_id: str):
    history = list(balance_history_collection.find(
        {"member_id": member_id},
        {"_id": 0}
    ).sort("updated_at", -1))
    return history

# Dashboard stats
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    total_members = members_collection.count_documents({})
    companies = list(companies_collection.find({}, {"_id": 0}))
    
    # Get member counts per company
    company_stats = []
    for company in companies:
        member_count = members_collection.count_documents({"company_id": company["id"]})
        total_points = 0
        
        members = list(members_collection.find({"company_id": company["id"]}, {"current_balance": 1}))
        for member in members:
            total_points += member.get("current_balance", 0)
        
        company_stats.append({
            "company": company,
            "member_count": member_count,
            "total_points": total_points
        })
    
    return {
        "total_members": total_members,
        "total_companies": len(companies),
        "company_stats": company_stats
    }

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)