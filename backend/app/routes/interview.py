from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import os
import time
import json
from app.database_mysql import get_db
from typing import Optional
import traceback

router = APIRouter(prefix="/interview", tags=["Interview"])

# Use Path for cross-platform compatibility
UPLOAD_DIR = Path("uploads/audio_files")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/create-candidate")
async def create_candidate(
    name: str = Form(...),
    email: str = Form(...),
    position: str = Form(...),
    phone: Optional[str] = Form(None)
):
    """Create a new candidate profile"""
    try:
        with get_db() as cursor:
            # Use %s placeholder for MySQL compatibility
            cursor.execute("SELECT id FROM candidates WHERE email = %s", (email,))
            existing = cursor.fetchone()

            if existing:
                raise HTTPException(status_code=400, detail=f"Candidate with email {email} already exists")

            cursor.execute(
                "INSERT INTO candidates (name, email, position, phone) VALUES (%s, %s, %s, %s)",
                (name, email, position, phone)
            )
            # For MySQL, get the last insert ID properly
            cursor.execute("SELECT LAST_INSERT_ID() as id")
            candidate_id = cursor.fetchone()['id']
            print(f"✅ Created candidate #{candidate_id}: {name} ({email})")

        return {
            "success": True,
            "candidate_id": candidate_id,
            "name": name,
            "email": email,
            "position": position
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating candidate: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-audio")
async def upload_audio(
    candidate_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload interview audio file"""
    try:
        # Convert candidate_id to integer
        try:
            candidate_id = int(candidate_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid candidate_id format")
        
        with get_db() as cursor:
            # Use %s placeholder for MySQL compatibility
            cursor.execute("SELECT name FROM candidates WHERE id = %s", (candidate_id,))
            candidate = cursor.fetchone()

            if not candidate:
                raise HTTPException(status_code=404, detail="Candidate not found")

        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        extension = file.filename.split('.')[-1].lower()
        allowed = os.getenv("ALLOWED_EXTENSIONS", "wav,mp3,m4a,ogg,webm,flac,mpeg,mp4,mov,avi,mkv").split(',')
        
        # Debug: Print allowed extensions
        print(f"🔍 Allowed extensions: {allowed}")
        print(f"📁 File extension: .{extension}")

        if extension not in allowed:
            raise HTTPException(status_code=400, detail=f"File type .{extension} not allowed")

        file_bytes = await file.read()
        size_limit = int(os.getenv("MAX_FILE_SIZE", 52428800))  # 50MB

        if len(file_bytes) > size_limit:
            raise HTTPException(status_code=400, detail="File too large")

        timestamp = int(time.time())
        filename = f"candidate_{candidate_id}_{timestamp}.{extension}"
        file_path = UPLOAD_DIR / filename

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        file_path_str = str(file_path).replace('\\', '/')

        with get_db() as cursor:
            # Use %s placeholder for MySQL compatibility
            cursor.execute(
                "INSERT INTO interviews (candidate_id, audio_path, status) VALUES (%s, %s, %s)",
                (candidate_id, file_path_str, 'uploaded')
            )
            # For MySQL, get the last insert ID properly
            cursor.execute("SELECT LAST_INSERT_ID() as id")
            interview_id = cursor.fetchone()['id']

        return {
            "success": True,
            "interview_id": interview_id,
            "filename": filename,
            "audio_path": file_path_str,
            "candidate_id": candidate_id,
            "candidate_name": candidate['name']
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading audio: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{interview_id}")
def get_interview_details(interview_id: int):
    """
    Get complete interview details including transcription, QA pairs, assessment,
    and AI recommendations
    
    ✅ FIXED: Returns assessment with ai_recommendation field
    """
    try:
        print(f"\n🔍 GET /interview/{interview_id} - Fetching interview details...")
        
        with get_db() as cursor:

            # Fetch interview + candidate info - use %s for MySQL
            print(f"   📊 Fetching interview data for ID: {interview_id}")
            cursor.execute("""
                SELECT i.*, c.name, c.email, c.position, c.phone
                FROM interviews i
                JOIN candidates c ON i.candidate_id = c.id
                WHERE i.id = %s
            """, (interview_id,))
            interview = cursor.fetchone()

            if not interview:
                print(f"   ❌ Interview not found: {interview_id}")
                raise HTTPException(status_code=404, detail="Interview not found")

            print(f"   ✅ Interview found: {interview['name']} - {interview['position']}")

            # Transcription - use %s for MySQL
            cursor.execute("""
                SELECT speaker, text, start_time, end_time, confidence
                FROM transcriptions
                WHERE interview_id = %s
                ORDER BY start_time
            """, (interview_id,))
            transcription = [dict(row) for row in cursor.fetchall()]
            print(f"   📝 Found {len(transcription)} transcription segments")

            # QA pairs - use %s for MySQL
            cursor.execute("""
                SELECT question, answer, question_time, answer_time
                FROM qa_pairs
                WHERE interview_id = %s
                ORDER BY question_time
            """, (interview_id,))
            qa_pairs = [dict(row) for row in cursor.fetchall()]
            print(f"   ❓ Found {len(qa_pairs)} QA pairs")

            # ✅ Assessment with AI recommendation - use %s for MySQL
            cursor.execute("""
                SELECT content_score, communication_score, confidence_score,
                       technical_score, overall_score, success_probability,
                       grade, strengths, weaknesses, recommendation, 
                       ai_recommendation, created_at
                FROM assessments
                WHERE interview_id = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, (interview_id,))
            assessment_row = cursor.fetchone()
            
            assessment_dict = None
            if assessment_row:
                print(f"\n🔍 GET /interview/{interview_id} - Assessment found")
                
                # ✅ Parse ai_recommendation JSON
                ai_rec = None
                if assessment_row["ai_recommendation"]:
                    try:
                        ai_rec = json.loads(assessment_row["ai_recommendation"])
                        print(f"   ✅ AI Recommendation loaded: {ai_rec.get('decision', 'N/A')}")
                    except Exception as json_error:
                        print(f"   ⚠️ Failed to parse ai_recommendation JSON: {json_error}")
                
                assessment_dict = {
                    # Core scores
                    "overall_score": float(assessment_row["overall_score"]),
                    "success_probability": float(assessment_row["success_probability"]),
                    "grade": assessment_row["grade"],
                    
                    # ✅ Nest scores in avg_scores
                    "avg_scores": {
                        "content": float(assessment_row["content_score"]),
                        "communication": float(assessment_row["communication_score"]),
                        "confidence": float(assessment_row["confidence_score"]),
                    },
                    
                    "technical_score": float(assessment_row["technical_score"]),
                    
                    # Text analysis
                    "strengths": assessment_row["strengths"],
                    "weaknesses": assessment_row["weaknesses"],
                    "recommendation": assessment_row["recommendation"],
                    
                    # ✅ AI Recommendation
                    "ai_recommendation": ai_rec,
                    
                    # Metadata
                    "assessed_at": assessment_row["created_at"],
                    
                    # Placeholders
                    "details": [],
                    "emotion_result": None
                }
            else:
                print(f"\n🔍 GET /interview/{interview_id} - No assessment found")

            # Compute summary
            total_segments = len(transcription)
            interviewer_segments = len([s for s in transcription if s["speaker"].lower() == "interviewer"])
            candidate_segments = len([s for s in transcription if s["speaker"].lower() == "candidate"])
            qa_pairs_count = len(qa_pairs)

            transcription_summary = {
                "total_segments": total_segments,
                "interviewer_segments": interviewer_segments,
                "candidate_segments": candidate_segments,
                "qa_pairs": qa_pairs_count
            }

            result = {
                "interview_id": interview['id'],
                "candidate": {
                    "id": interview['candidate_id'],
                    "name": interview['name'],
                    "email": interview['email'],
                    "position": interview['position'],
                    "phone": interview['phone']
                },
                "audio_path": interview['audio_path'],
                "duration": interview['duration'],
                "status": interview['status'],
                "created_at": interview['created_at'],
                "transcription_summary": transcription_summary,
                "transcription": transcription,
                "qa_pairs": qa_pairs,
                "assessment": assessment_dict
            }
            
            print(f"   ✅ Successfully prepared response for interview {interview_id}")
            return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching interview {interview_id}: {e}")
        print(f"   📋 Full traceback:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/audio/{interview_id}")
def get_audio_file(interview_id: int):
    """Download/stream interview audio"""
    try:
        with get_db() as cursor:
            # Use %s placeholder for MySQL compatibility
            cursor.execute("SELECT audio_path FROM interviews WHERE id = %s", (interview_id,))
            result = cursor.fetchone()

            if not result:
                raise HTTPException(status_code=404, detail="Interview not found")

            audio_path = result['audio_path'].replace('\\', '/')

            if not os.path.exists(audio_path):
                raise HTTPException(status_code=404, detail="Audio file not found")

            return FileResponse(audio_path, media_type="audio/mpeg", filename=os.path.basename(audio_path))

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error retrieving audio: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/candidate/{candidate_id}/latest")
def get_latest_interview(candidate_id: int):
    """Get the latest interview for a candidate"""
    try:
        with get_db() as cursor:
            cursor.execute("""
                SELECT id FROM interviews 
                WHERE candidate_id = %s 
                ORDER BY created_at DESC 
                LIMIT 1
            """, (candidate_id,))
            result = cursor.fetchone()
            
            if result:
                return {
                    "success": True,
                    "interview_id": result['id']
                }
            else:
                return {
                    "success": False,
                    "message": "No interviews found for this candidate"
                }
                
    except Exception as e:
        print(f"❌ Error fetching latest interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{interview_id}")
def delete_interview(interview_id: int):
    """Delete an interview and its associated data"""
    try:
        with get_db() as cursor:
            # Use %s placeholder for MySQL compatibility
            cursor.execute("SELECT audio_path FROM interviews WHERE id = %s", (interview_id,))
            result = cursor.fetchone()

            if not result:
                raise HTTPException(status_code=404, detail="Interview not found")

            audio_path = result['audio_path'].replace('\\', '/')
            
            # Use %s placeholder for MySQL compatibility
            cursor.execute("DELETE FROM interviews WHERE id = %s", (interview_id,))
            
            if os.path.exists(audio_path):
                os.remove(audio_path)
                print(f"🗑️ Deleted audio file: {audio_path}")
            
            cursor.commit()

        return {"success": True, "message": f"Interview {interview_id} deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting interview: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))












# from fastapi import APIRouter, UploadFile, File, Form, HTTPException
# from fastapi.responses import JSONResponse, FileResponse
# from pathlib import Path
# import os
# import time
# from app.database_mysql import get_db
# from typing import Optional

# router = APIRouter(prefix="/interview", tags=["Interview"])

# # Use Path for cross-platform compatibility
# UPLOAD_DIR = Path("uploads/audio_files")
# UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# @router.post("/create-candidate")
# async def create_candidate(
#     name: str = Form(...),
#     email: str = Form(...),
#     position: str = Form(...),
#     phone: Optional[str] = Form(None)
# ):
#     """
#     Create a new candidate profile
    
#     Args:
#         name: Candidate full name
#         email: Email address (must be unique)
#         position: Job position applying for
#         phone: Optional phone number
    
#     Returns:
#         candidate_id for future reference
#     """
#     try:
#         with get_db() as conn:
#             cursor = conn.cursor()
            
#             # Check if email already exists
#             cursor.execute("SELECT id FROM candidates WHERE email = ?", (email,))
#             existing = cursor.fetchone()
            
#             if existing:
#                 raise HTTPException(
#                     status_code=400, 
#                     detail=f"Candidate with email {email} already exists"
#                 )
            
#             # Insert new candidate
#             cursor.execute(
#                 "INSERT INTO candidates (name, email, position, phone) VALUES (?, ?, ?, ?)",
#                 (name, email, position, phone)
#             )
#             candidate_id = cursor.lastrowid
            
#             print(f"✅ Created candidate #{candidate_id}: {name} ({email})")
            
#         return {
#             "success": True,
#             "candidate_id": candidate_id,
#             "name": name,
#             "email": email,
#             "position": position
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error creating candidate: {e}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))


# @router.post("/upload-audio")
# async def upload_audio(
#     candidate_id: int = Form(...), 
#     file: UploadFile = File(...)
# ):
#     """
#     Upload interview audio file
    
#     Args:
#         candidate_id: ID of the candidate
#         file: Audio file (wav, mp3, m4a, ogg, webm, flac)
    
#     Returns:
#         interview_id and file details
#     """
#     try:
#         # Validate candidate exists
#         with get_db() as conn:
#             cursor = conn.cursor()
#             cursor.execute("SELECT name FROM candidates WHERE id = ?", (candidate_id,))
#             candidate = cursor.fetchone()
            
#             if not candidate:
#                 raise HTTPException(status_code=404, detail="Candidate not found")
        
#         # Validate file
#         if not file.filename:
#             raise HTTPException(status_code=400, detail="No file provided")
        
#         extension = file.filename.split('.')[-1].lower()
#         allowed = os.getenv("ALLOWED_EXTENSIONS", "wav,mp3,m4a,ogg,webm,flac").split(',')
        
#         if extension not in allowed:
#             raise HTTPException(
#                 status_code=400, 
#                 detail=f"File type .{extension} not allowed. Allowed: {', '.join(allowed)}"
#             )
        
#         # Read and validate file size
#         file_bytes = await file.read()
#         size_limit = int(os.getenv("MAX_FILE_SIZE", 52428800))  # 50MB default
        
#         if len(file_bytes) > size_limit:
#             raise HTTPException(
#                 status_code=400, 
#                 detail=f"File too large. Max size: {size_limit / 1024 / 1024:.0f}MB"
#             )
        
#         # Generate unique filename
#         timestamp = int(time.time())
#         filename = f"candidate_{candidate_id}_{timestamp}.{extension}"
        
#         # Create Path object for the file
#         file_path = UPLOAD_DIR / filename
        
#         # Save file to disk
#         try:
#             with open(file_path, "wb") as f:
#                 f.write(file_bytes)
#         except Exception as e:
#             print(f"❌ Error writing file: {e}")
#             raise HTTPException(status_code=500, detail=f"Failed to save audio file: {str(e)}")
        
#         # Verify file was actually saved
#         if not file_path.exists():
#             raise HTTPException(status_code=500, detail="Failed to save audio file - file does not exist after writing")
        
#         # FIX: Use RELATIVE path with forward slashes ONLY (NO absolute path!)
#         # This is the KEY FIX - don't use .resolve()!
#         file_path_str = str(file_path).replace('\\', '/')
        
#         print(f"\n{'='*60}")
#         print(f"📤 AUDIO UPLOAD")
#         print(f"{'='*60}")
#         print(f"   Filename: {filename}")
#         print(f"   Path (relative): {file_path_str}")
#         print(f"   Path (absolute): {file_path.resolve()}")
        
#         # Create interview record in database
#         with get_db() as conn:
#             cursor = conn.cursor()
#             cursor.execute(
#                 "INSERT INTO interviews (candidate_id, audio_path, status) VALUES (?, ?, ?)",
#                 (candidate_id, file_path_str, 'uploaded')
#             )
#             interview_id = cursor.lastrowid
        
#         file_size_mb = len(file_bytes) / 1024 / 1024
        
#         print(f"   Size: {file_size_mb:.2f}MB")
#         print(f"   Interview ID: {interview_id}")
#         print(f"{'='*60}\n")
        
#         return {
#             "success": True,
#             "interview_id": interview_id,
#             "filename": filename,
#             "audio_path": file_path_str,
#             "file_size_mb": round(file_size_mb, 2),
#             "candidate_id": candidate_id,
#             "candidate_name": candidate['name']
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error uploading audio: {e}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))


# @router.get("/interview/{interview_id}")
# def get_interview_details(interview_id: int):
#     """
#     Get complete interview details including transcription and assessment
    
#     Args:
#         interview_id: Interview ID
        
#     Returns:
#         Complete interview information
#     """
#     try:
#         with get_db() as conn:
#             cursor = conn.cursor()
            
#             # Get interview with candidate info
#             cursor.execute("""
#                 SELECT i.*, c.name, c.email, c.position, c.phone
#                 FROM interviews i
#                 JOIN candidates c ON i.candidate_id = c.id
#                 WHERE i.id = ?
#             """, (interview_id,))
            
#             interview = cursor.fetchone()
            
#             if not interview:
#                 raise HTTPException(status_code=404, detail="Interview not found")
            
#             # Get transcription segments
#             cursor.execute("""
#                 SELECT speaker, text, start_time, end_time, confidence
#                 FROM transcriptions
#                 WHERE interview_id = ?
#                 ORDER BY start_time
#             """, (interview_id,))
            
#             transcription = [dict(row) for row in cursor.fetchall()]
            
#             # Get QA pairs
#             cursor.execute("""
#                 SELECT question, answer, question_time, answer_time
#                 FROM qa_pairs
#                 WHERE interview_id = ?
#                 ORDER BY question_time
#             """, (interview_id,))
            
#             qa_pairs = [dict(row) for row in cursor.fetchall()]
            
#             # Get assessment
#             cursor.execute("""
#                 SELECT content_score, communication_score, confidence_score,
#                        technical_score, overall_score, success_probability,
#                        grade, strengths, weaknesses, recommendation
#                 FROM assessments
#                 WHERE interview_id = ?
#                 ORDER BY created_at DESC
#                 LIMIT 1
#             """, (interview_id,))
            
#             assessment = cursor.fetchone()
#             assessment_dict = dict(assessment) if assessment else None
            
#             return {
#                 "interview_id": interview['id'],
#                 "candidate": {
#                     "id": interview['candidate_id'],
#                     "name": interview['name'],
#                     "email": interview['email'],
#                     "position": interview['position'],
#                     "phone": interview['phone']
#                 },
#                 "audio_path": interview['audio_path'],
#                 "duration": interview['duration'],
#                 "status": interview['status'],
#                 "created_at": interview['created_at'],
#                 "transcription": transcription,
#                 "qa_pairs": qa_pairs,
#                 "assessment": assessment_dict
#             }
            
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error fetching interview: {e}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))


# @router.get("/audio/{interview_id}")
# def get_audio_file(interview_id: int):
#     """
#     Download/stream audio file for an interview
    
#     Args:
#         interview_id: Interview ID
        
#     Returns:
#         Audio file
#     """
#     try:
#         with get_db() as conn:
#             cursor = conn.cursor()
#             cursor.execute("SELECT audio_path FROM interviews WHERE id = ?", (interview_id,))
#             result = cursor.fetchone()
            
#             if not result:
#                 raise HTTPException(status_code=404, detail="Interview not found")
            
#             audio_path = result['audio_path']
            
#             # Normalize path - convert backslashes to forward slashes
#             audio_path = audio_path.replace('\\', '/')
            
#             # Check if file exists
#             if not os.path.exists(audio_path):
#                 raise HTTPException(status_code=404, detail=f"Audio file not found: {audio_path}")
            
#             return FileResponse(
#                 audio_path,
#                 media_type="audio/mpeg",
#                 filename=os.path.basename(audio_path)
#             )
            
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error retrieving audio: {e}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))


# @router.delete("/interview/{interview_id}")
# def delete_interview(interview_id: int):
#     """
#     Delete an interview and its associated data
    
#     Args:
#         interview_id: Interview ID
        
#     Returns:
#         Success message
#     """
#     try:
#         with get_db() as conn:
#             cursor = conn.cursor()
            
#             # Get audio path before deletion
#             cursor.execute("SELECT audio_path FROM interviews WHERE id = ?", (interview_id,))
#             result = cursor.fetchone()
            
#             if not result:
#                 raise HTTPException(status_code=404, detail="Interview not found")
            
#             audio_path = result['audio_path']
            
#             # Normalize path
#             audio_path = audio_path.replace('\\', '/')
            
#             # Delete from database (cascades to related tables)
#             cursor.execute("DELETE FROM interviews WHERE id = ?", (interview_id,))
            
#             # Delete audio file if it exists
#             if os.path.exists(audio_path):
#                 try:
#                     os.remove(audio_path)
#                     print(f"🗑️ Deleted audio file: {audio_path}")
#                 except Exception as e:
#                     print(f"⚠️ Warning: Could not delete audio file: {e}")
            
#             print(f"✅ Deleted interview #{interview_id}")
            
#         return {
#             "success": True,
#             "message": f"Interview {interview_id} deleted successfully"
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error deleting interview: {e}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))
