from fastapi import APIRouter
from app.database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats():
    """Return average scores and top candidates for HR dashboard"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.name, a.overall_score, a.grade, a.success_probability
            FROM assessments a
            JOIN interviews i ON i.id = a.interview_id
            JOIN candidates c ON c.id = i.candidate_id
            ORDER BY a.overall_score DESC
            LIMIT 5
        """)
        top_candidates = cursor.fetchall()

        cursor.execute("""
            SELECT 
                AVG(content_score) as avg_content,
                AVG(technical_score) as avg_technical,
                AVG(communication_score) as avg_communication,
                AVG(confidence_score) as avg_confidence,
                AVG(overall_score) as avg_overall
            FROM assessments
        """)
        averages = cursor.fetchone()

    return {
        "averages": averages,
        "top_candidates": top_candidates
    }
