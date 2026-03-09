import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# === Load environment variables ===
load_dotenv()

# === Import local modules ===
from app.database_mysql import init_db_pool, get_db
from app.services.questions import init_questions_db

# Initialize database function
def init_db():
    """Initialize database connection pool"""
    init_db_pool()

from app.routes import (
    interview_router,
    assessment_router,
    candidates_router,
    history,
    dashboard,
    transcription,
    questions_router,
    live_interview_router,
    config_router,
    interviews,
)

# ==========================================================
# 🚀 FastAPI Application Setup
# ==========================================================
fastapi_app = FastAPI(
    title="AI Interview Assessment System",
    description="Automated interview evaluation using speech recognition and NLP",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ==========================================================
# 🌐 CORS Configuration
# ==========================================================
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use specific origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# 📦 Include all API routers
# ==========================================================
fastapi_app.include_router(interview_router)
fastapi_app.include_router(assessment_router)
fastapi_app.include_router(candidates_router)
fastapi_app.include_router(history.router)
fastapi_app.include_router(dashboard.router)
fastapi_app.include_router(transcription.router)
fastapi_app.include_router(questions_router)
fastapi_app.include_router(live_interview_router)
fastapi_app.include_router(config_router)
fastapi_app.include_router(interviews.router)

# ==========================================================
# 🌍 API Root Endpoint
# ==========================================================
@fastapi_app.get("/")
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
            "history": "/history",
            "transcription": "/transcription",
            "questions": "/questions",
            "live_interview": "/live-interview",
            "config": "/config",
        },
    }

# ==========================================================
# 🩺 Health Check Endpoint
# ==========================================================
@fastapi_app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "whisper_model": "loaded"
        if os.getenv("USE_LOCAL_WHISPER", "true") == "true"
        else "disabled",
    }

# ==========================================================
# 🚀 Startup Event
# ==========================================================
@fastapi_app.on_event("startup")
async def startup_event():
    print("\n" + "=" * 60)
    print("🚀 Starting AI Interview Assessment System...")
    print("=" * 60)
    
    # Initialize database
    init_db()
    
    # Create upload directories
    os.makedirs("uploads/audio_files", exist_ok=True)
    os.makedirs("uploads/temp", exist_ok=True)
    
    # Check API keys
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and len(gemini_key) > 10:
        print("✅ Gemini API key configured")
    else:
        print("⚠️ Gemini API key not configured")
    
    aipipe_key = os.getenv("AIPIPE_API_KEY")
    if aipipe_key:
        print("✅ AIPIPE API key configured")
    else:
        print("⚠️ AIPIPE API key not configured")
    
    print("\n✅ System Ready!")
    print("📖 Docs: http://localhost:8000/docs")
    print("=" * 60 + "\n")

# ==========================================================
# 🛑 Shutdown Event
# ==========================================================
@fastapi_app.on_event("shutdown")
async def shutdown_event():
    print("👋 Shutting down gracefully...")

# ==========================================================
# ENTRY POINT
# ==========================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:fastapi_app", host="0.0.0.0", port=8000, reload=True)