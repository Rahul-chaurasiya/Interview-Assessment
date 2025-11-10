import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import socketio

# === Load environment variables ===
load_dotenv()

# === Import local modules ===
from app.database import init_db
from app.routes import (
    interview_router,
    assessment_router,
    candidates_router,
    history,
    dashboard,
    meeting,
    transcription,
    assessment_from_transcript,
)

# ==========================================================
# 🔌 SOCKET.IO SETUP
# ==========================================================
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
)

# Create FastAPI app
fastapi_app = FastAPI(
    title="AI Interview Assessment System",
    description="Automated interview evaluation using speech recognition and NLP",
    version="1.0.1",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ==========================================================
# 🌐 CORS CONFIG
# ==========================================================
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # use specific origins in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# 📦 Routers
# ==========================================================
fastapi_app.include_router(interview_router)
fastapi_app.include_router(assessment_router)
fastapi_app.include_router(candidates_router)
fastapi_app.include_router(history.router)
fastapi_app.include_router(dashboard.router)
fastapi_app.include_router(meeting.router)
fastapi_app.include_router(transcription.router)
fastapi_app.include_router(assessment_from_transcript.router)

# ==========================================================
# 🔄 SOCKET.IO EVENT HANDLERS
# ==========================================================
@sio.event
async def connect(sid, environ):
    print(f"✅ Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"❌ Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room = data.get("room")
    if not room:
        return
    sio.enter_room(sid, room)
    print(f"🎯 {sid} joined room {room}")
    await sio.emit("joined", {"sid": sid, "room": room}, room=room)

@sio.event
async def leave_room(sid, data):
    room = data.get("room")
    if room:
        sio.leave_room(sid, room)
        print(f"👋 {sid} left room {room}")
        await sio.emit("user_left", {"sid": sid, "room": room}, room=room)

@sio.event
async def signal(sid, data):
    room = data.get("room")
    if not room:
        return
    await sio.emit("signal", data, room=room, skip_sid=sid)

# ==========================================================
# 🧠 MOUNT SOCKET.IO ON /ws
# ==========================================================
socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

# ==========================================================
# 🌍 ROOT
# ==========================================================
@fastapi_app.get("/")
def root():
    return {
        "message": "AI Interview Assessment System API",
        "version": "1.0.1",
        "status": "running",
        "docs": "/docs",
    }

@fastapi_app.get("/health")
def health_check():
    return {"status": "healthy", "db": "connected"}

# ==========================================================
# ⚠️ ERROR HANDLER
# ==========================================================
@fastapi_app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"❌ Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "details": str(exc)},
    )

# ==========================================================
# 🚀 STARTUP & SHUTDOWN
# ==========================================================
@fastapi_app.on_event("startup")
async def startup_event():
    print("\n🚀 Starting AI Interview Assessment System...")
    init_db()
    os.makedirs("uploads/audio_files", exist_ok=True)
    os.makedirs("uploads/temp", exist_ok=True)
    print("✅ System Ready! Docs → http://localhost:8000/docs\n")

@fastapi_app.on_event("shutdown")
async def shutdown_event():
    print("👋 Shutting down gracefully...")

# ==========================================================
# ENTRY POINT
# ==========================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000, reload=True)




# import os
# from dotenv import load_dotenv
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# import socketio

# # === Load environment variables ===
# load_dotenv()

# # === Import local modules ===
# from app.database import init_db
# from app.routes import (
#     interview_router,
#     assessment_router,
#     candidates_router,
#     history,
#     dashboard,
#     meeting,
#     transcription,
#     assessment_from_transcript,
# )

# # ==========================================================
# # 🔌 SOCKET.IO SETUP
# # ==========================================================
# sio = socketio.AsyncServer(
#     async_mode="asgi",
#     cors_allowed_origins="*",
#     logger=True,
#     engineio_logger=True,
# )

# # Create FastAPI app
# app = FastAPI(
#     title="AI Interview Assessment System",
#     description="Automated interview evaluation using speech recognition and NLP",
#     version="1.0.0",
#     docs_url="/docs",
#     redoc_url="/redoc",
# )

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Use specific origin in production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ==========================================================
# # 📦 Include all API routers
# # ==========================================================
# app.include_router(interview_router)
# app.include_router(assessment_router)
# app.include_router(candidates_router)
# app.include_router(history.router)
# app.include_router(dashboard.router)
# app.include_router(meeting.router)
# app.include_router(transcription.router)
# app.include_router(assessment_from_transcript.router)

# # ==========================================================
# # 🔄 SOCKET.IO EVENT HANDLERS
# # ==========================================================
# @sio.event
# async def connect(sid, environ):
#     print(f"✅ Client connected: {sid}")

# @sio.event
# async def disconnect(sid):
#     print(f"❌ Client disconnected: {sid}")

# @sio.event
# async def join_room(sid, data):
#     """Join a specific interview room."""
#     room = data.get("room")
#     if room:
#         sio.enter_room(sid, room)
#         print(f"🎯 {sid} joined room {room}")
#         await sio.emit("user_joined", {"sid": sid, "room": room}, room=room)

# @sio.event
# async def signal(sid, data):
#     """Forward WebRTC signaling data to the partner in the same room."""
#     room = data.get("room")
#     if room:
#         await sio.emit("signal", data, room=room, skip_sid=sid)

# # ==========================================================
# # 🧠 Mount Socket.IO at /ws
# # ==========================================================
# socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
# app.mount("/ws", socket_app)

# # ==========================================================
# # 🌍 API ROOT
# # ==========================================================
# @app.get("/")
# def root():
#     return {
#         "message": "AI Interview Assessment System API",
#         "version": "1.0.0",
#         "status": "running",
#         "docs": "/docs",
#         "endpoints": {
#             "interviews": "/interview",
#             "assessments": "/assessment",
#             "candidates": "/candidates",
#             "dashboard": "/dashboard",
#             "history": "/history",
#             "meeting": "/meeting",
#             "transcription": "/transcription",
#             "assessment_from_transcript": "/assessment_from_transcript",
#             "ws_socketio": "/ws/socket.io",
#         },
#     }

# # ==========================================================
# # 🩺 Healthcheck
# # ==========================================================
# @app.get("/health")
# def health_check():
#     return {
#         "status": "healthy",
#         "database": "connected",
#         "whisper_model": "loaded"
#         if os.getenv("USE_LOCAL_WHISPER", "true") == "true"
#         else "disabled",
#     }

# # ==========================================================
# # ⚠️ Exception handler
# # ==========================================================
# @app.exception_handler(Exception)
# async def global_exception_handler(request, exc):
#     print(f"❌ Unhandled exception: {exc}")
#     return JSONResponse(
#         status_code=500,
#         content={"error": "Internal server error", "detail": str(exc)},
#     )

# # ==========================================================
# # 🚀 Startup & Shutdown
# # ==========================================================
# @app.on_event("startup")
# async def startup_event():
#     print("\n" + "=" * 60)
#     print("🚀 AI INTERVIEW ASSESSMENT SYSTEM STARTING...")
#     print("=" * 60)
#     init_db()
#     os.makedirs("uploads/audio_files", exist_ok=True)
#     os.makedirs("uploads/temp", exist_ok=True)
#     print("\n✅ System Ready!")
#     print("📖 Docs: http://localhost:8000/docs")
#     print("=" * 60 + "\n")

# @app.on_event("shutdown")
# async def shutdown_event():
#     print("\n👋 Shutting down AI Interview Assessment System...")

# # ==========================================================
# # 🔥 Entry point
# # ==========================================================
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)




# import os
# from dotenv import load_dotenv
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse

# # FIRST: Load env variables
# load_dotenv()

# # === Import Routers ===
# from app.database import init_db       # Ensure this exists in your project
# from app.routes import (
#     interview_router,
#     assessment_router,
#     candidates_router,
#     history,
#     dashboard,
#     meeting,
#     transcription,
#     assessment_from_transcript
# )

# # FOR SOCKET.IO ASGI APP
# # meeting.app should be the Socket.IO ASGI application in meeting.py

# # === FastAPI App Setup ===
# app = FastAPI(
#     title="AI Interview Assessment System",
#     description="Automated interview evaluation using speech recognition and NLP",
#     version="1.0.0",
#     docs_url="/docs",
#     redoc_url="/redoc"
# )

# # === CORS Middleware ===
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Danger in prod!
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # === Include Routers (API endpoints) ===
# app.include_router(interview_router)
# app.include_router(assessment_router)
# app.include_router(candidates_router)
# app.include_router(history.router)
# app.include_router(dashboard.router)
# app.include_router(meeting.router)
# app.include_router(transcription.router)
# app.include_router(assessment_from_transcript.router)

# # === Mount Socket.IO ASGI app at /ws ===
# app.mount("/ws", meeting.app)

# # === Root API Endpoint ===
# @app.get("/")
# def root():
#     return {
#         "message": "AI Interview Assessment System API",
#         "version": "1.0.0",
#         "status": "running",
#         "docs": "/docs",
#         "endpoints": {
#             "interviews": "/interview",
#             "assessments": "/assessment",
#             "candidates": "/candidates",
#             "dashboard": "/dashboard",
#             "history": "/history",
#             "meeting": "/meeting",
#             "transcription": "/transcription",
#             "assessment_from_transcript": "/assessment_from_transcript",
#             "ws_socketio": "/ws"
#         }
#     }

# # === Healthcheck Endpoint ===
# @app.get("/health")
# def health_check():
#     return {
#         "status": "healthy",
#         "database": "connected",
#         "whisper_model": "loaded" if os.getenv("USE_LOCAL_WHISPER", "true") == "true" else "disabled"
#     }

# # === Global Exception Handler ===
# @app.exception_handler(Exception)
# async def global_exception_handler(request, exc):
#     print(f"❌ Unhandled exception: {exc}")
#     return JSONResponse(
#         status_code=500,
#         content={"error": "Internal server error", "detail": str(exc)}
#     )

# # === Startup & Shutdown Events ===
# @app.on_event("startup")
# async def startup_event():
#     print("\n" + "=" * 60)
#     print("🚀 AI INTERVIEW ASSESSMENT SYSTEM STARTING...")
#     print("=" * 60)

#     # Initialize DB (if your project needs it)
#     init_db()

#     # Create uploads directories
#     os.makedirs("uploads/audio_files", exist_ok=True)
#     os.makedirs("uploads/temp", exist_ok=True)

#     print("\n✅ System Ready!")
#     print("📖 API Documentation: http://localhost:8000/docs")
#     print("=" * 60 + "\n")

# @app.on_event("shutdown")
# async def shutdown_event():
#     print("\n👋 Shutting down AI Interview Assessment System...")




# from dotenv import load_dotenv  # ✅ ADD THIS

# # ✅ Load environment variables FIRST
# load_dotenv()

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from app.database import init_db
# import os

# # ✅ Import Routers
# from app.routes import (
#     interview_router,
#     assessment_router,
#     candidates_router,
#     history,
#     dashboard
# )

# # ✅ Initialize FastAPI app FIRST (before including routers)
# app = FastAPI(
#     title="AI Interview Assessment System",
#     description="Automated interview evaluation using speech recognition and NLP",
#     version="1.0.0",
#     docs_url="/docs",
#     redoc_url="/redoc"
# )

# # ✅ Add CORS Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # ⚠️ Restrict this in production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ✅ Include all routers
# app.include_router(interview_router)
# app.include_router(assessment_router)
# app.include_router(candidates_router)
# app.include_router(history.router)
# app.include_router(dashboard.router)

# # ✅ Root endpoint
# @app.get("/")
# def root():
#     return {
#         "message": "AI Interview Assessment System API",
#         "version": "1.0.0",
#         "status": "running",
#         "docs": "/docs",
#         "endpoints": {
#             "interviews": "/interview",
#             "assessments": "/assessment",
#             "candidates": "/candidates",
#             "dashboard": "/dashboard",
#             "history": "/history"
#         }
#     }

# # ✅ Health check endpoint
# @app.get("/health")
# def health_check():
#     return {
#         "status": "healthy",
#         "database": "connected",
#         "whisper_model": "loaded" if os.getenv("USE_LOCAL_WHISPER", "true") == "true" else "disabled"
#     }

# # ✅ Global exception handler
# @app.exception_handler(Exception)
# async def global_exception_handler(request, exc):
#     print(f"❌ Unhandled exception: {exc}")
#     return JSONResponse(
#         status_code=500,
#         content={"error": "Internal server error", "detail": str(exc)}
#     )

# # ✅ Startup event (runs once on server start)
# @app.on_event("startup")
# async def startup_event():
#     """Initialize system on startup"""
#     print("\n" + "=" * 60)
#     print("🚀 AI INTERVIEW ASSESSMENT SYSTEM STARTING...")
#     print("=" * 60)

#     # Ensure database is initialized
#     init_db()

#     # Create directories for uploads
#     os.makedirs("uploads/audio_files", exist_ok=True)
#     os.makedirs("uploads/temp", exist_ok=True)

#     print("\n✅ System Ready!")
#     print("📖 API Documentation: http://localhost:8000/docs")
#     print("=" * 60 + "\n")

# # ✅ Shutdown event
# @app.on_event("shutdown")
# async def shutdown_event():
#     print("\n👋 Shutting down AI Interview Assessment System...")
