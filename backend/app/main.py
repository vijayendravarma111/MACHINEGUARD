import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import init_db
from backend.app.api import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print(f"[MACHINEGUARD] Initializing {settings.PROJECT_NAME} Backend Services...")
    init_db()
    yield
    # Shutdown logic
    print(f"[MACHINEGUARD] Shutting down {settings.PROJECT_NAME} Backend Services.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Industrial Machine Health Monitoring and Predictive Maintenance Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS for React Frontend Development & Production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router under /api
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "description": "Industrial Machine Health Monitoring and Predictive Maintenance Platform",
        "status": "RUNNING",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
