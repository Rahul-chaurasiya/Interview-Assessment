from dotenv import load_dotenv  # ✅ ADD THIS

# ✅ Load environment variables FIRST
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import init_db
import os

# ✅ Import Routers
from app.routes import (
    interview_router,
    assessment_router,
    candidates_router,
    history,
    dashboard
)

# ✅ Initialize FastAPI app FIRST (before including routers)
app = FastAPI(
    title="AI Interview Assessment System",
    description="Automated interview evaluation using speech recognition and NLP",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ✅ Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include all routers
app.include_router(interview_router)
app.include_router(assessment_router)
app.include_router(candidates_router)
app.include_router(history.router)
app.include_router(dashboard.router)

# ✅ Root endpoint
@app.get("/")
def root():
    return {
        "message": "AI Interview Assessment System API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "interviews": "/interview",
            "assessments": "/assessment",
            "candidates": "/candidates",
            "dashboard": "/dashboard",
            "history": "/history"
        }
    }

# ✅ Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "whisper_model": "loaded" if os.getenv("USE_LOCAL_WHISPER", "true") == "true" else "disabled"
    }

# ✅ Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

# ✅ Startup event (runs once on server start)
@app.on_event("startup")
async def startup_event():
    """Initialize system on startup"""
    print("\n" + "=" * 60)
    print("🚀 AI INTERVIEW ASSESSMENT SYSTEM STARTING...")
    print("=" * 60)

    # Ensure database is initialized
    init_db()

    # Create directories for uploads
    os.makedirs("uploads/audio_files", exist_ok=True)
    os.makedirs("uploads/temp", exist_ok=True)

    print("\n✅ System Ready!")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("=" * 60 + "\n")

# ✅ Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    print("\n👋 Shutting down AI Interview Assessment System...")
