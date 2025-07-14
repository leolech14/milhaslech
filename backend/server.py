from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
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

# MongoDB connection
mongo_client = MongoClient(os.getenv("MONGO_URL"))
db = mongo_client[os.getenv("DB_NAME")]

# Collections
companies_collection = db.companies
members_collection = db.members
global_log_collection = db.global_log
postits_collection = db.postits

# Pydantic models
class Company(BaseModel):
    id: str
    name: str
    color: str

class ProgramData(BaseModel):
    company_id: str
    login: str = ""
    password: str = ""
    cpf: str = ""
    card_number: str = ""
    current_balance: int = 0
    elite_tier: str = ""
    notes: str = ""
    last_updated: datetime = None
    last_change: str = ""
    custom_fields: Dict[str, Any] = {}

class CustomField(BaseModel):
    name: str
    value: str = ""
    field_type: str = "text"  # text or number

class NewCompanyData(BaseModel):
    company_name: str
    color: str = "#4a90e2"

class Member(BaseModel):
    id: str
    name: str
    programs: Dict[str, ProgramData]
    created_at: datetime
    updated_at: datetime

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    programs: Optional[Dict[str, Dict[str, Any]]] = None

class GlobalLogEntry(BaseModel):
    id: str
    member_id: str
    member_name: str
    company_id: str
    company_name: str
    field_changed: str
    old_value: str
    new_value: str
    timestamp: datetime
    change_type: str  # "update", "create", "delete"

class ProgramUpdate(BaseModel):
    login: Optional[str] = None
    password: Optional[str] = None
    cpf: Optional[str] = None
    card_number: Optional[str] = None
    current_balance: Optional[int] = None
    elite_tier: Optional[str] = None
    notes: Optional[str] = None

# Initialize default data
async def init_default_data():
    # Default companies
    default_companies = [
        {
            "id": "latam",
            "name": "LATAM Pass",
            "color": "#d31b2c",
            "points_name": "milhas"
        },
        {
            "id": "smiles",
            "name": "Smiles",
            "color": "#ff6600",
            "points_name": "milhas"
        },
        {
            "id": "azul",
            "name": "TudoAzul",
            "color": "#0072ce",
            "points_name": "pontos"
        }
    ]
    
    # Create companies
    for company in default_companies:
        existing = companies_collection.find_one({"id": company["id"]})
        if not existing:
            companies_collection.insert_one(company)
    
    # Family members
    family_members = ["Osvandré", "Marilise", "Graciela", "Leonardo"]
    
    # Create family members with empty program data
    for member_name in family_members:
        existing_member = members_collection.find_one({"name": member_name})
        
        if not existing_member:
            member_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            # Create empty program data for each company
            programs = {}
            for company in default_companies:
                programs[company["id"]] = {
                    "company_id": company["id"],
                    "login": "",
                    "password": "",
                    "cpf": "",
                    "card_number": "",
                    "current_balance": 0,
                    "elite_tier": "",
                    "notes": "",
                    "last_updated": now,
                    "last_change": "Conta criada"
                }
            
            member_data = {
                "id": member_id,
                "name": member_name,
                "programs": programs,
                "created_at": now,
                "updated_at": now
            }
            
            members_collection.insert_one(member_data)

# Startup event
@app.on_event("startup")
async def startup_event():
    await init_default_data()

class PostIt(BaseModel):
    id: str
    content: str
    created_at: datetime
    updated_at: datetime

class PostItCreate(BaseModel):
    content: str

class PostItUpdate(BaseModel):
    content: str
def log_change(member_id: str, member_name: str, company_id: str, company_name: str, 
               field_changed: str, old_value: str, new_value: str, change_type: str = "update"):
    log_entry = {
        "id": str(uuid.uuid4()),
        "member_id": member_id,
        "member_name": member_name,
        "company_id": company_id,
        "company_name": company_name,
        "field_changed": field_changed,
        "old_value": str(old_value),
        "new_value": str(new_value),
        "timestamp": datetime.utcnow(),
        "change_type": change_type
    }
    global_log_collection.insert_one(log_entry)

# Company endpoints
@app.get("/api/companies", response_model=List[Company])
async def get_companies():
    companies = list(companies_collection.find({}, {"_id": 0}))
    return companies

# Member endpoints
@app.get("/api/members", response_model=List[Member])
async def get_members():
    members = list(members_collection.find({}, {"_id": 0}))
    return members

@app.get("/api/members/{member_id}", response_model=Member)
async def get_member(member_id: str):
    member = members_collection.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    return Member(**member)

@app.put("/api/members/{member_id}")
async def update_member(member_id: str, member_update: MemberUpdate):
    member = members_collection.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    update_data = {"updated_at": datetime.utcnow()}
    
    # Update member name if provided
    if member_update.name:
        old_name = member["name"]
        update_data["name"] = member_update.name
        log_change(member_id, old_name, "", "", "nome", old_name, member_update.name)
    
    # Update programs if provided
    if member_update.programs:
        companies = {c["id"]: c for c in companies_collection.find({}, {"_id": 0})}
        
        for company_id, program_data in member_update.programs.items():
            if company_id in member["programs"]:
                old_program = member["programs"][company_id]
                updated_program = old_program.copy()
                
                # Track changes for each field
                changes = []
                for field, new_value in program_data.items():
                    if field in old_program and old_program[field] != new_value:
                        old_value = old_program[field]
                        updated_program[field] = new_value
                        changes.append(f"{field}: {old_value} → {new_value}")
                        
                        # Log individual field changes
                        company_name = companies.get(company_id, {}).get("name", company_id)
                        log_change(member_id, member["name"], company_id, company_name, 
                                 field, str(old_value), str(new_value))
                
                # Update last_updated and last_change
                updated_program["last_updated"] = datetime.utcnow()
                if changes:
                    updated_program["last_change"] = ", ".join(changes)
                
                # Update the member's program data
                if "programs" not in update_data:
                    update_data["programs"] = member["programs"].copy()
                update_data["programs"][company_id] = updated_program
    
    # Update member in database
    members_collection.update_one(
        {"id": member_id},
        {"$set": update_data}
    )
    
    # Return updated member
    updated_member = members_collection.find_one({"id": member_id}, {"_id": 0})
    return Member(**updated_member)

@app.put("/api/members/{member_id}/programs/{company_id}")
async def update_program(member_id: str, company_id: str, program_update: ProgramUpdate):
    member = members_collection.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    if company_id not in member["programs"]:
        raise HTTPException(status_code=404, detail="Programa não encontrado")
    
    company = companies_collection.find_one({"id": company_id})
    company_name = company["name"] if company else company_id
    
    old_program = member["programs"][company_id]
    updated_program = old_program.copy()
    
    # Track changes
    changes = []
    update_dict = program_update.dict(exclude_unset=True)
    
    for field, new_value in update_dict.items():
        if field in old_program and old_program[field] != new_value:
            old_value = old_program[field]
            updated_program[field] = new_value
            changes.append(f"{field}: {old_value} → {new_value}")
            
            # Log change
            log_change(member_id, member["name"], company_id, company_name, 
                     field, str(old_value), str(new_value))
    
    # Update timestamps and change info
    updated_program["last_updated"] = datetime.utcnow()
    if changes:
        updated_program["last_change"] = ", ".join(changes)
    
    # Update in database
    members_collection.update_one(
        {"id": member_id},
        {
            "$set": {
                f"programs.{company_id}": updated_program,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Programa atualizado com sucesso", "changes": changes}

# Add new company to member
@app.post("/api/members/{member_id}/companies")
async def add_company_to_member(member_id: str, new_company: NewCompanyData):
    member = members_collection.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    # Create new company ID
    company_id = str(uuid.uuid4())
    
    # Create company entry
    company_data = {
        "id": company_id,
        "name": new_company.company_name,
        "color": new_company.color,
        "points_name": new_company.points_name
    }
    
    # Add to companies collection if it doesn't exist
    existing_company = companies_collection.find_one({"name": new_company.company_name})
    if not existing_company:
        companies_collection.insert_one(company_data)
    else:
        company_id = existing_company["id"]
    
    # Create default program data for the member
    default_program = {
        "company_id": company_id,
        "login": "",
        "password": "",
        "cpf": "",
        "card_number": "",
        "current_balance": 0,
        "elite_tier": "",
        "notes": "",
        "last_updated": datetime.utcnow(),
        "last_change": "Programa criado",
        "custom_fields": {}
    }
    
    # Add program to member
    members_collection.update_one(
        {"id": member_id},
        {
            "$set": {
                f"programs.{company_id}": default_program,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Log the addition
    log_change(member_id, member["name"], company_id, new_company.company_name, 
               "programa", "", "adicionado")
    
    return {
        "message": "Nova companhia adicionada com sucesso",
        "company_id": company_id,
        "company_name": new_company.company_name
    }

# Custom fields management
@app.put("/api/members/{member_id}/programs/{company_id}/fields")
async def update_custom_fields(member_id: str, company_id: str, custom_fields: Dict[str, Any]):
    member = members_collection.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    if company_id not in member.get("programs", {}):
        raise HTTPException(status_code=404, detail="Programa não encontrado")
    
    # Update custom fields
    members_collection.update_one(
        {"id": member_id},
        {
            "$set": {
                f"programs.{company_id}.custom_fields": custom_fields,
                f"programs.{company_id}.last_updated": datetime.utcnow(),
                f"programs.{company_id}.last_change": "Campos personalizados atualizados"
            }
        }
    )
    
    # Get company name for logging
    company = companies_collection.find_one({"id": company_id})
    company_name = company["name"] if company else company_id
    
    # Log the change
    log_change(member_id, member["name"], company_id, company_name, 
               "campos_customizados", "", "atualizados")
    
    return {"message": "Campos personalizados atualizados com sucesso"}

@app.delete("/api/members/{member_id}/programs/{company_id}")
async def delete_member_program(member_id: str, company_id: str):
    member = members_collection.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    if company_id not in member.get("programs", {}):
        raise HTTPException(status_code=404, detail="Programa não encontrado")
    
    # Get company name for logging
    company = companies_collection.find_one({"id": company_id})
    company_name = company["name"] if company else company_id
    
    # Remove program from member
    members_collection.update_one(
        {"id": member_id},
        {
            "$unset": {f"programs.{company_id}": ""},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    # Log the deletion
    log_change(member_id, member["name"], company_id, company_name, 
               "programa", company_name, "removido")
    
    return {"message": "Programa removido com sucesso"}

# Global log endpoint
@app.get("/api/global-log")
async def get_global_log(limit: int = 50):
    log_entries = list(global_log_collection.find(
        {}, 
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit))
    
    return log_entries

# Dashboard stats
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    total_members = members_collection.count_documents({})
    total_companies = companies_collection.count_documents({})
    
    # Calculate total points across all programs
    total_points = 0
    members = list(members_collection.find({}, {"programs": 1}))
    
    for member in members:
        for program in member.get("programs", {}).values():
            total_points += program.get("current_balance", 0)
    
    # Get recent activity count
    recent_logs = global_log_collection.count_documents({
        "timestamp": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)}
    })
    
    return {
        "total_members": total_members,
        "total_companies": total_companies,
        "total_points": total_points,
        "recent_activity": recent_logs
    }

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Post-it endpoints
@app.get("/api/postits", response_model=List[PostIt])
async def get_postits():
    postits = list(postits_collection.find({}, {"_id": 0}).sort("created_at", 1))
    return postits

@app.post("/api/postits", response_model=PostIt)
async def create_postit(postit: PostItCreate):
    postit_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    postit_data = {
        "id": postit_id,
        "content": postit.content,
        "created_at": now,
        "updated_at": now
    }
    
    postits_collection.insert_one(postit_data)
    return PostIt(**postit_data)

@app.put("/api/postits/{postit_id}", response_model=PostIt)
async def update_postit(postit_id: str, postit_update: PostItUpdate):
    postit = postits_collection.find_one({"id": postit_id})
    if not postit:
        raise HTTPException(status_code=404, detail="Post-it não encontrado")
    
    update_data = {
        "content": postit_update.content,
        "updated_at": datetime.utcnow()
    }
    
    postits_collection.update_one(
        {"id": postit_id},
        {"$set": update_data}
    )
    
    updated_postit = postits_collection.find_one({"id": postit_id}, {"_id": 0})
    return PostIt(**updated_postit)

@app.delete("/api/postits/{postit_id}")
async def delete_postit(postit_id: str):
    result = postits_collection.delete_one({"id": postit_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post-it não encontrado")
    
    return {"message": "Post-it excluído com sucesso"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)