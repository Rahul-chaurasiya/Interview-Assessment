from fastapi import APIRouter, HTTPException
from app.database import get_db
import json

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/candidate/{candidate_id}")
def get_candidate_history(candidate_id: int):
    """
    Returns candidate info, all interviews, assessments (if any) and evaluation logs grouped by interview.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Candidate
        cursor.execute("SELECT id, name, email, position, phone, created_at FROM candidates WHERE id = ?", (candidate_id,))
        candidate = cursor.fetchone()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Interviews for candidate
        cursor.execute("""
            SELECT id, audio_path, duration, status, created_at
            FROM interviews
            WHERE candidate_id = ?
            ORDER BY created_at DESC
        """, (candidate_id,))
        interviews = cursor.fetchall()

        history = []
        for interview in interviews:
            interview_id = interview["id"]

            # assessment (if exists)
            cursor.execute("""
                SELECT id, content_score, communication_score, confidence_score, technical_score,
                       overall_score, success_probability, grade, strengths, weaknesses, recommendation, created_at
                FROM assessments
                WHERE interview_id = ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (interview_id,))
            assessment = cursor.fetchone()

            # QA pairs
            cursor.execute("""
                SELECT id, question, answer, question_time, answer_time, pair_valid, created_at
                FROM qa_pairs
                WHERE interview_id = ?
                ORDER BY question_time
            """, (interview_id,))
            qa_pairs = cursor.fetchall()

            # evaluation logs
            cursor.execute("""
                SELECT id, analysis_type, analysis_data, created_at
                FROM evaluation_logs
                WHERE interview_id = ?
                ORDER BY created_at ASC
            """, (interview_id,))
            logs = cursor.fetchall()
            parsed_logs = []
            for log in logs:
                try:
                    parsed_data = json.loads(log["analysis_data"])
                except Exception:
                    parsed_data = log["analysis_data"]
                parsed_logs.append({
                    "id": log["id"],
                    "type": log["analysis_type"],
                    "data": parsed_data,
                    "created_at": log["created_at"]
                })

            history.append({
                "interview": dict(interview),
                "assessment": dict(assessment) if assessment else None,
                "qa_pairs": [dict(q) for q in qa_pairs],
                "logs": parsed_logs
            })

    return {
        "candidate": dict(candidate),
        "history": history
    }


@router.get("/interview/{interview_id}")
def get_interview_history(interview_id: int):
    """
    Return one interview's transcription, QA, assessment and logs.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT id, candidate_id, audio_path, duration, status, created_at FROM interviews WHERE id = ?", (interview_id,))
        interview = cursor.fetchone()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        # Candidate summary
        cursor.execute("SELECT id, name, email, position FROM candidates WHERE id = ?", (interview["candidate_id"],))
        candidate = cursor.fetchone()

        # Transcriptions
        cursor.execute("""
            SELECT speaker, text, start_time, end_time, confidence, created_at
            FROM transcriptions WHERE interview_id = ? ORDER BY start_time
        """, (interview_id,))
        transcriptions = cursor.fetchall()

        # Q/A
        cursor.execute("""
            SELECT id, question, answer, question_time, answer_time, pair_valid, created_at
            FROM qa_pairs WHERE interview_id = ? ORDER BY question_time
        """, (interview_id,))
        qa_pairs = cursor.fetchall()

        # Assessment
        cursor.execute("""
            SELECT id, content_score, communication_score, confidence_score, technical_score,
                   overall_score, success_probability, grade, strengths, weaknesses, recommendation, created_at
            FROM assessments
            WHERE interview_id = ? ORDER BY created_at DESC LIMIT 1
        """, (interview_id,))
        assessment = cursor.fetchone()

        # Logs
        cursor.execute("""
            SELECT id, analysis_type, analysis_data, created_at
            FROM evaluation_logs
            WHERE interview_id = ? ORDER BY created_at ASC
        """, (interview_id,))
        logs = cursor.fetchall()
        parsed_logs = []
        for log in logs:
            try:
                parsed_data = json.loads(log["analysis_data"])
            except Exception:
                parsed_data = log["analysis_data"]
            parsed_logs.append({
                "id": log["id"],
                "type": log["analysis_type"],
                "data": parsed_data,
                "created_at": log["created_at"]
            })

    return {
        "interview": dict(interview),
        "candidate": dict(candidate) if candidate else None,
        "transcriptions": [dict(t) for t in transcriptions],
        "qa_pairs": [dict(q) for q in qa_pairs],
        "assessment": dict(assessment) if assessment else None,
        "logs": parsed_logs
    }


@router.get("/list")
def list_all_interviews(limit: int = 50, offset: int = 0):
    """
    Lightweight listing endpoint: returns interview rows + assessment summary (if exists).
    Useful for dashboards.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT i.id as interview_id, i.candidate_id, c.name as candidate_name, i.status, i.created_at,
                   a.overall_score, a.grade, a.success_probability
            FROM interviews i
            LEFT JOIN candidates c ON c.id = i.candidate_id
            LEFT JOIN assessments a ON a.interview_id = i.id
            ORDER BY i.created_at DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))
        rows = cursor.fetchall()

    return {"items": [dict(r) for r in rows]}
