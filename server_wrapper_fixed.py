import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

# Create app without importing backend
app = FastAPI(title="Programas de Milhas Família Lech API", version="1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to import backend routes
try:
    from backend.server import (
        companies_collection, members_collection, global_log_collection, 
        postits_collection, Company, ProgramData, Member, UpdateProgramData,
        GlobalLogEntry, PostIt, UpdatePostIt
    )
    
    # Import all routes from backend
    import backend.server
    
    # Copy all routes from backend.server to our app
    for route in backend.server.app.routes:
        if hasattr(route, 'endpoint'):
            app.add_api_route(
                route.path,
                route.endpoint,
                methods=route.methods,
                **{k: v for k, v in route.__dict__.items() 
                   if k not in ['path', 'endpoint', 'methods']}
            )
    
    print("Backend routes loaded successfully")
except Exception as e:
    print(f"Warning: Could not load backend routes: {e}")
    
    # Add a simple health check endpoint
    @app.get("/api/health")
    async def health_check():
        return {"status": "unhealthy", "error": "MongoDB connection failed"}

# Mount the frontend build directory
if os.path.exists("frontend/build"):
    app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")
    
    # Serve index.html for all non-API routes
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Skip API routes
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Return index.html for all other routes
        return FileResponse("frontend/build/index.html")

print("Server started successfully")