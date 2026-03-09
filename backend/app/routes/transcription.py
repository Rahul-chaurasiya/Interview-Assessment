# backend/app/routes/transcription.py
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
import requests

router = APIRouter(prefix="/transcription", tags=["Transcription"])
AIPIPE_API_KEY = os.getenv("AIPIPE_API_KEY")

if not AIPIPE_API_KEY:
    print("Warning: AIPIPE_API_KEY not set. Transcription will fail until you set it.")

@router.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """
    Accepts an audio blob (audio/webm, audio/wav). Uses AIPipe's REST
    transcription endpoint. Returns JSON with 'transcript'.
    """
    if not AIPIPE_API_KEY:
        raise HTTPException(status_code=500, detail="AIPIPE_API_KEY not configured on server")

    # read file bytes
    content = await file.read()

    # send to AIPipe (adjust URL according to their docs)
    url = "https://api.aipipe.io/v1/audio/transcriptions"
    try:
        files = {"file": (file.filename, content, file.content_type)}
        data = {"model": "whisper-1"}  # adjust if AIPipe requires different param
        headers = {"Authorization": f"Bearer {AIPIPE_API_KEY}"}
        resp = requests.post(url, headers=headers, files=files, data=data, timeout=60)
        resp.raise_for_status()
        result = resp.json()
        # Many Whisper-like APIs return { "text": "..." }
        transcript = result.get("text") or result.get("transcript") or result.get("data", {}).get("text", "")
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")