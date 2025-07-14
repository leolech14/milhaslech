import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

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
        postits_collection, Company, ProgramData, Member, ProgramUpdate,
        GlobalLogEntry, PostIt, PostItUpdate
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

# Get the base path
BASE_PATH = Path(__file__).resolve().parent

# Mount the frontend build directory - Fix the path issue
if (BASE_PATH / "frontend/build").exists():
    # Mount static files with correct path
    app.mount("/static", StaticFiles(directory=str(BASE_PATH / "frontend/build/static")), name="static")
    
    # Serve root path
    @app.get("/")
    async def serve_root():
        return FileResponse(str(BASE_PATH / "frontend/build/index.html"))
    
    # Serve index.html for all non-API routes
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Skip API routes
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Check if it's a static file request
        if full_path.startswith("static/"):
            file_path = BASE_PATH / "frontend/build" / full_path
            if file_path.exists() and file_path.is_file():
                return FileResponse(str(file_path))
        
        # Return index.html for all other routes (React Router handling)
        return FileResponse(str(BASE_PATH / "frontend/build/index.html"))
else:
    print(f"Warning: Frontend build directory not found at {BASE_PATH / 'frontend/build'}")
    @app.get("/")
    async def root():
        return {"error": "Frontend not built. Please run 'npm run build' in the frontend directory."}

print("Server started successfully")