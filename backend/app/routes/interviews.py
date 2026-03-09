from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.database_mysql import get_db

router = APIRouter(prefix="/interviews", tags=["Interviews"])


# =====================================================
# Request/Response Models
# =====================================================

class InterviewResponse(BaseModel):
    id: int
    candidate_id: int
    candidate_name: str
    candidate_email: str
    role: str
    interview_type: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    score: Optional[float] = None
    questions_count: int
    duration_minutes: Optional[int] = None


class InterviewSummary(BaseModel):
    id: int
    candidate_name: str
    role: str
    interview_type: str
    status: str
    created_at: datetime
    score: Optional[float] = None


# =====================================================
# API Endpoints
# =====================================================

@router.get("/", response_model=List[InterviewResponse])
async def get_all_interviews(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None)
):
    """
    Get all interviews with pagination and optional status filter
    """
    try:
        with get_db() as cursor:
            # Build query with optional status filter
            query = """
                SELECT 
                    i.id,
                    i.candidate_id,
                    c.name as candidate_name,
                    c.email as candidate_email,
                    (SELECT role FROM questions q 
                     JOIN interview_questions iq ON q.id = iq.question_id 
                     WHERE iq.interview_id = i.id LIMIT 1) as role,
                    'live' as interview_type,
                    i.status,
                    i.created_at,
                    NULL as score,
                    (SELECT COUNT(*) FROM interview_questions iq WHERE iq.interview_id = i.id) as questions_count,
                    TIMESTAMPDIFF(MINUTE, i.created_at, NOW()) as duration_minutes
                FROM interviews i
                LEFT JOIN candidates c ON i.candidate_id = c.id
            """
            
            params = []
            if status:
                query += " WHERE i.status = %s"
                params.append(status)
            
            query += """
                ORDER BY i.created_at DESC
                LIMIT %s OFFSET %s
            """
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            interviews = cursor.fetchall()
            
            # Convert to response format
            result = []
            for interview in interviews:
                result.append({
                    'id': interview['id'],
                    'candidate_id': interview['candidate_id'],
                    'candidate_name': interview['candidate_name'] or 'Unknown Candidate',
                    'candidate_email': interview['candidate_email'] or '',
                    'role': interview['role'] or 'Unknown',
                    'interview_type': interview['interview_type'],
                    'status': interview['status'],
                    'created_at': interview['created_at'],
                    'completed_at': None,
                    'score': interview['score'],
                    'questions_count': interview['questions_count'],
                    'duration_minutes': interview['duration_minutes']
                })
            
            return result
            
    except Exception as e:
        print(f"❌ Error fetching interviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent", response_model=List[InterviewSummary])
async def get_recent_interviews(limit: int = Query(3, le=10)):
    """
    Get recent interviews for dashboard
    """
    try:
        with get_db() as cursor:
            query = """
                SELECT 
                    i.id,
                    c.name as candidate_name,
                    (SELECT role FROM questions q 
                     JOIN interview_questions iq ON q.id = iq.question_id 
                     WHERE iq.interview_id = i.id LIMIT 1) as role,
                    'live' as interview_type,
                    i.status,
                    i.created_at,
                    NULL as score
                FROM interviews i
                LEFT JOIN candidates c ON i.candidate_id = c.id
                ORDER BY i.created_at DESC
                LIMIT %s
            """
            
            cursor.execute(query, (limit,))
            interviews = cursor.fetchall()
            
            # Convert to response format
            result = []
            for interview in interviews:
                result.append({
                    'id': interview['id'],
                    'candidate_name': interview['candidate_name'] or 'Unknown Candidate',
                    'role': interview['role'] or 'Unknown',
                    'interview_type': interview['interview_type'],
                    'status': interview['status'],
                    'created_at': interview['created_at'],
                    'score': interview['score']
                })
            
            return result
            
    except Exception as e:
        print(f"❌ Error fetching recent interviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview_by_id(interview_id: int):
    """
    Get specific interview by ID
    """
    try:
        with get_db() as cursor:
            query = """
                SELECT 
                    i.id,
                    i.candidate_id,
                    c.name as candidate_name,
                    c.email as candidate_email,
                    COALESCE(q.role, 'Unknown') as role,
                    'live' as interview_type,
                    i.status,
                    i.created_at,
                    i.completed_at,
                    NULL as score,
                    COUNT(iq.question_id) as questions_count,
                    TIMESTAMPDIFF(MINUTE, i.created_at, COALESCE(i.completed_at, NOW())) as duration_minutes
                FROM interviews i
                LEFT JOIN candidates c ON i.candidate_id = c.id
                LEFT JOIN interview_questions iq ON i.id = iq.interview_id
                LEFT JOIN questions q ON iq.question_id = q.id
                WHERE i.id = %s
                GROUP BY i.id
            """
            
            cursor.execute(query, (interview_id,))
            interview = cursor.fetchone()
            
            if not interview:
                raise HTTPException(status_code=404, detail="Interview not found")
            
            return {
                'id': interview['id'],
                'candidate_id': interview['candidate_id'],
                'candidate_name': interview['candidate_name'] or 'Unknown Candidate',
                'candidate_email': interview['candidate_email'] or '',
                'role': interview['role'],
                'interview_type': interview['interview_type'],
                'status': interview['status'],
                'created_at': interview['created_at'],
                'completed_at': interview['completed_at'],
                'score': interview['score'],
                'questions_count': interview['questions_count'],
                'duration_minutes': interview['duration_minutes']
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_interviews_stats():
    """
    Get interviews statistics for dashboard
    """
    try:
        with get_db() as cursor:
            # Get total interviews
            cursor.execute("SELECT COUNT(*) as total FROM interviews")
            total_interviews = cursor.fetchone()['total']
            
            # Get completed interviews
            cursor.execute("SELECT COUNT(*) as completed FROM interviews WHERE status = 'completed'")
            completed_interviews = cursor.fetchone()['completed']
            
            # Get average score
            cursor.execute("SELECT AVG(score) as avg_score FROM interviews WHERE status = 'completed' AND score IS NOT NULL")
            avg_score_result = cursor.fetchone()
            avg_score = float(avg_score_result['avg_score']) if avg_score_result['avg_score'] else 0
            
            # Get success rate
            success_rate = (completed_interviews / total_interviews * 100) if total_interviews > 0 else 0
            
            return {
                'total_interviews': total_interviews,
                'completed_interviews': completed_interviews,
                'avg_score': round(avg_score, 1),
                'success_rate': round(success_rate, 1)
            }
            
    except Exception as e:
        print(f"❌ Error fetching interview stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
