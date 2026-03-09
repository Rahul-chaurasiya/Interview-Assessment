"""
Live Interview Routes - Flow 2
Question-by-Question Interview with Time Tracking & Follow-ups
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.database_mysql import get_db
from app.services.transcription import TranscriptionService
from app.services.nlp_evaluation import NLPEvaluator
from app.services.scoring import ScoringService
from app.services.ai_recommendation import AIRecommendationGenerator
from app.services.questions import generate_question_set
from pydantic import BaseModel
from typing import Optional, List
import os
import time
import json
import traceback
from datetime import datetime
from pathlib import Path

router = APIRouter(prefix="/live-interview", tags=["Live Interview"])

# Initialize services
transcription_service = TranscriptionService()
nlp_evaluator = NLPEvaluator()
scorer = ScoringService()
ai_generator = AIRecommendationGenerator()

# Upload directory for live interview audio
UPLOAD_DIR = Path("uploads/live_interview")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# Request/Response Models
# ============================================================

class StartSessionRequest(BaseModel):
    candidate_id: int
    role: str
    questions: List[dict]


class SaveResponseRequest(BaseModel):
    session_id: int
    question_id: int
    response_text: Optional[str] = None
    transcript: Optional[str] = None
    response_time_seconds: float


class GenerateFollowUpRequest(BaseModel):
    session_id: int
    question_id: int
    previous_answer: str


# ============================================================
# API Endpoints
# ============================================================

@router.post("/start")
async def start_live_interview(request: StartSessionRequest):
    """
    Start a new live interview session with assigned questions
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Verify candidate exists
            cursor.execute("SELECT name, position FROM candidates WHERE id = ?", (request.candidate_id,))
            candidate = cursor.fetchone()
            if not candidate:
                raise HTTPException(status_code=404, detail="Candidate not found")
            
            # Create session
            cursor.execute(
                """
                INSERT INTO live_interview_sessions 
                (candidate_id, role, status, total_questions)
                VALUES (?, ?, 'in_progress', ?)
                """,
                (request.candidate_id, request.role, len(request.questions))
            )
            session_id = cursor.lastrowid
            
            # Insert questions
            for i, q in enumerate(request.questions):
                cursor.execute(
                    """
                    INSERT INTO live_interview_questions 
                    (session_id, question_id, question_text, category, difficulty, ideal_answer, sequence_order, asked_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """,
                    (
                        session_id,
                        q.get("id"),
                        q.get("question_text"),
                        q.get("category"),
                        q.get("difficulty"),
                        q.get("ideal_answer"),
                        i + 1
                    )
            )
            
            cursor.commit()
            
            cursor.execute(
                """
                SELECT id, question_text, category, difficulty, sequence_order
                FROM live_interview_questions
                WHERE session_id = ?
                ORDER BY sequence_order
                LIMIT 1
                """,
                (session_id,)
            )
            first_question = dict(cursor.fetchone())
            
            return {
                "success": True,
                "session_id": session_id,
                "candidate_name": candidate["name"],
                "role": request.role,
                "total_questions": len(request.questions),
                "current_question": first_question,
                "status": "in_progress"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error starting live interview: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def get_session_status(session_id: int):
    """
    Get current session status and current question
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get session info
            cursor.execute(
                """
                SELECT s.*, c.name as candidate_name, c.email, c.position
                FROM live_interview_sessions s
                JOIN candidates c ON s.candidate_id = c.id
                WHERE s.id = ?
                """,
                (session_id,)
            )
            session = cursor.fetchone()
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            # Get current question (first unanswered)
            cursor.execute(
                """
                SELECT id, question_text, category, difficulty, sequence_order, is_followup
                FROM live_interview_questions
                WHERE session_id = ? AND answered_at IS NULL
                ORDER BY sequence_order, is_followup
                LIMIT 1
                """,
                (session_id,)
            )
            current_question = cursor.fetchone()
            
            # Get all questions progress
            cursor.execute(
                """
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN answered_at IS NOT NULL THEN 1 ELSE 0 END) as answered
                FROM live_interview_questions
                WHERE session_id = ?
                """,
                (session_id,)
            )
            progress = cursor.fetchone()
            
            return {
                "session_id": session_id,
                "candidate": {
                    "name": session["candidate_name"],
                    "email": session["email"],
                    "position": session["position"]
                },
                "role": session["role"],
                "status": session["status"],
                "progress": {
                    "total": progress["total"],
                    "answered": progress["answered"],
                    "percentage": (progress["answered"] / progress["total"] * 100) if progress["total"] > 0 else 0
                },
                "current_question": dict(current_question) if current_question else None,
                "started_at": session["started_at"],
                "completed_at": session["completed_at"]
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/response/{session_id}")
async def save_question_response(
    session_id: int,
    question_id: int = Form(...),
    audio: Optional[UploadFile] = File(None),
    response_text: Optional[str] = Form(None),
    response_time_seconds: float = Form(...)
):
    """
    Save candidate's response to a question
    Can include audio file and/or text response
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Verify session exists
            cursor.execute("SELECT id FROM live_interview_sessions WHERE id = ?", (session_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Session not found")
            
            # Verify question exists
            cursor.execute(
                "SELECT id, question_text FROM live_interview_questions WHERE id = ? AND session_id = ?",
                (question_id, session_id)
            )
            question = cursor.fetchone()
            if not question:
                raise HTTPException(status_code=404, detail="Question not found")
            
            audio_path = None
            transcript = response_text
            
            # Save audio if provided
            if audio:
                timestamp = int(time.time())
                filename = f"session_{session_id}_question_{question_id}_{timestamp}.webm"
                file_path = UPLOAD_DIR / filename
                
                audio_bytes = await audio.read()
                with open(file_path, "wb") as f:
                    f.write(audio_bytes)
                
                audio_path = str(file_path).replace('\\', '/')
                
                # Transcribe audio if no text provided
                if not response_text and audio_path:
                    try:
                        transcription = transcription_service.transcribe_audio(audio_path)
                        transcript = transcription.get("full_text", "")
                    except Exception as e:
                        print(f"⚠️ Transcription failed: {e}")
            
            # Update question with response
            cursor.execute(
                """
                UPDATE live_interview_questions
                SET answered_at = CURRENT_TIMESTAMP,
                    response_time_seconds = ?,
                    audio_path = ?,
                    transcript = ?
                WHERE id = ?
                """,
                (response_time_seconds, audio_path, transcript, question_id)
            )
            
            # Update session answered count
            cursor.execute(
                """
                UPDATE live_interview_sessions
                SET answered_questions = answered_questions + 1
                WHERE id = ?
                """,
                (session_id,)
            )
            
            # Evaluate the response
            nlp_result = nlp_evaluator.evaluate_answer(
                question["question_text"],
                transcript or "",
                None
            )
            
            # Save evaluation
            cursor.execute(
                """
                INSERT INTO live_interview_responses 
                (session_id, question_id, response_text, audio_path, transcript, 
                 response_time_seconds, content_score, communication_score, 
                 confidence_score, feedback)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id, question_id, response_text, audio_path, transcript,
                    response_time_seconds,
                    nlp_result.get("content_score", 0),
                    nlp_result.get("communication_score", 0),
                    nlp_result.get("confidence_score", 0),
                    nlp_result.get("feedback", ""),
                )
            )
            
            response_id = cursor.lastrowid
            conn.commit()
            
            # Check if there are more questions
            cursor.execute(
                """
                SELECT id FROM live_interview_questions
                WHERE session_id = ? AND answered_at IS NULL
                ORDER BY sequence_order
                LIMIT 1
                """,
                (session_id,)
            )
            next_question = cursor.fetchone()
            
            return {
                "success": True,
                "response_id": response_id,
                "evaluation": {
                    "content_score": nlp_result.get("content_score", 0),
                    "communication_score": nlp_result.get("communication_score", 0),
                    "confidence_score": nlp_result.get("confidence_score", 0),
                    "feedback": nlp_result.get("feedback", "")
                },
                "has_more_questions": next_question is not None,
                "next_question_id": next_question["id"] if next_question else None
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error saving response: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/question/{session_id}/next")
async def get_next_question(session_id: int):
    """
    Get the next question in the interview
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get next unanswered question
            cursor.execute(
                """
                SELECT id, question_text, category, difficulty, sequence_order, is_followup
                FROM live_interview_questions
                WHERE session_id = ? AND answered_at IS NULL
                ORDER BY sequence_order, is_followup
                LIMIT 1
                """,
                (session_id,)
            )
            question = cursor.fetchone()
            
            if not question:
                return {
                    "success": True,
                    "has_more_questions": False,
                    "message": "All questions answered"
                }
            
            # Mark question as asked
            cursor.execute(
                "UPDATE live_interview_questions SET asked_at = CURRENT_TIMESTAMP WHERE id = ?",
                (question["id"],)
            )
            conn.commit()
            
            return {
                "success": True,
                "has_more_questions": True,
                "question": dict(question)
            }
            
    except Exception as e:
        print(f"❌ Error getting next question: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/followup/{session_id}")
async def generate_followup_question(session_id: int, question_id: int):
    """
    Generate a follow-up question based on the candidate's previous answer
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get the previous question and answer
            cursor.execute(
                """
                SELECT q.question_text, q.transcript, r.content_score
                FROM live_interview_questions q
                LEFT JOIN live_interview_responses r ON q.id = r.question_id
                WHERE q.id = ? AND q.session_id = ?
                """,
                (question_id, session_id)
            )
            prev_q = cursor.fetchone()
            
            if not prev_q:
                raise HTTPException(status_code=404, detail="Question not found")
            
            # Generate follow-up using AI
            followup_text = ai_recommender.generate_followup_question(
                prev_q["question_text"],
                prev_q["transcript"] or "",
                prev_q["content_score"] or 50
            )
            
            # Save follow-up question
            cursor.execute(
                """
                INSERT INTO live_interview_questions 
                (session_id, question_text, category, difficulty, sequence_order, 
                 is_followup, parent_question_id, asked_at)
                VALUES (?, ?, 'Follow-up', 'Dynamic', 
                    (SELECT MAX(sequence_order) + 1 FROM live_interview_questions WHERE session_id = ?),
                    1, ?, CURRENT_TIMESTAMP)
                """,
                (session_id, followup_text, session_id, question_id)
            )
            
            followup_id = cursor.lastrowid
            conn.commit()
            
            return {
                "success": True,
                "followup_question": {
                    "id": followup_id,
                    "question_text": followup_text,
                    "is_followup": True,
                    "parent_question_id": question_id
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating follow-up: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/complete/{session_id}")
async def complete_interview(session_id: int):
    """
    Mark interview as complete and generate final evaluation
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get session info
            cursor.execute(
                """
                SELECT s.*, c.name, c.position
                FROM live_interview_sessions s
                JOIN candidates c ON s.candidate_id = c.id
                WHERE s.id = ?
                """,
                (session_id,)
            )
            session = cursor.fetchone()
            
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            # Get all responses with scores
            cursor.execute(
                """
                SELECT r.*, q.question_text
                FROM live_interview_responses r
                JOIN live_interview_questions q ON r.question_id = q.id
                WHERE r.session_id = ?
                ORDER BY r.evaluated_at
                """,
                (session_id,)
            )
            responses = cursor.fetchall()
            
            if not responses:
                raise HTTPException(status_code=400, detail="No responses to evaluate")
            
            # Calculate averages
            content_scores = [r["content_score"] for r in responses if r["content_score"]]
            comm_scores = [r["communication_score"] for r in responses if r["communication_score"]]
            conf_scores = [r["confidence_score"] for r in responses if r["confidence_score"]]
            
            avg_content = sum(content_scores) / len(content_scores) if content_scores else 0
            avg_comm = sum(comm_scores) / len(comm_scores) if comm_scores else 0
            avg_conf = sum(conf_scores) / len(conf_scores) if conf_scores else 0
            
            # Calculate overall score
            overall_score = (avg_content + avg_comm + avg_conf) / 3
            
            # Determine grade
            if overall_score >= 90:
                grade = "A+"
            elif overall_score >= 80:
                grade = "A"
            elif overall_score >= 70:
                grade = "B"
            elif overall_score >= 60:
                grade = "C"
            else:
                grade = "D"
            
            # Calculate success probability
            success_prob = min(100, max(0, overall_score + (10 if avg_conf > 50 else -10)))
            
            # Generate AI recommendations
            ai_recommendation = ai_recommender.generate_detailed_feedback(
                qa_pairs=[{"question": r["question_text"], "answer": r["transcript"]} for r in responses],
                scores={
                    "content_score": avg_content,
                    "communication_score": avg_comm,
                    "confidence_score": avg_conf,
                    "technical_score": avg_content,  # Use content as proxy
                    "overall_score": overall_score
                },
                candidate_name=session["name"],
                position=session["position"]
            )
            
            # Update session as completed
            cursor.execute(
                """
                UPDATE live_interview_sessions
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (session_id,)
            )
            conn.commit()
            
            return {
                "success": True,
                "session_id": session_id,
                "evaluation": {
                    "overall_score": round(overall_score, 2),
                    "grade": grade,
                    "success_probability": round(success_prob, 2),
                    "avg_scores": {
                        "content": round(avg_content, 2),
                        "communication": round(avg_comm, 2),
                        "confidence": round(avg_conf, 2)
                    },
                    "total_questions": session["total_questions"],
                    "answered_questions": session["answered_questions"],
                    "ai_recommendation": ai_recommendation
                },
                "next_step": f"GET /live-interview/results/{session_id} for detailed results"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error completing interview: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{session_id}")
async def get_interview_results(session_id: int):
    """
    Get detailed interview results
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get session info
            cursor.execute(
                """
                SELECT s.*, c.name, c.email, c.position
                FROM live_interview_sessions s
                JOIN candidates c ON s.candidate_id = c.id
                WHERE s.id = ?
                """,
                (session_id,)
            )
            session = cursor.fetchone()
            
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            # Get all questions and responses
            cursor.execute(
                """
                SELECT 
                    q.id,
                    q.question_text,
                    q.category,
                    q.difficulty,
                    q.is_followup,
                    q.response_time_seconds,
                    q.transcript,
                    r.content_score,
                    r.communication_score,
                    r.confidence_score,
                    r.feedback
                FROM live_interview_questions q
                LEFT JOIN live_interview_responses r ON q.id = r.question_id
                WHERE q.session_id = ?
                ORDER BY q.sequence_order, q.is_followup
                """,
                (session_id,)
            )
            questions = [dict(row) for row in cursor.fetchall()]
            
            # Calculate final scores
            answered = [q for q in questions if q["content_score"] is not None]
            
            if answered:
                avg_content = sum(q["content_score"] for q in answered) / len(answered)
                avg_comm = sum(q["communication_score"] for q in answered) / len(answered)
                avg_conf = sum(q["confidence_score"] for q in answered) / len(answered)
                overall = (avg_content + avg_comm + avg_conf) / 3
            else:
                avg_content = avg_comm = avg_conf = overall = 0
            
            return {
                "session_id": session_id,
                "candidate": {
                    "name": session["name"],
                    "email": session["email"],
                    "position": session["position"]
                },
                "role": session["role"],
                "status": session["status"],
                "started_at": session["started_at"],
                "completed_at": session["completed_at"],
                "total_questions": session["total_questions"],
                "answered_questions": session["answered_questions"],
                "scores": {
                    "overall": round(overall, 2),
                    "content": round(avg_content, 2),
                    "communication": round(avg_comm, 2),
                    "confidence": round(avg_conf, 2)
                },
                "questions": questions
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}")
async def delete_session(session_id: int):
    """
    Delete a live interview session
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Delete session (cascades to questions and responses)
            cursor.execute("DELETE FROM live_interview_sessions WHERE id = ?", (session_id,))
            conn.commit()
            
            return {
                "success": True,
                "message": f"Session {session_id} deleted"
            }
            
    except Exception as e:
        print(f"❌ Error deleting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

