from backend.server import app
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

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