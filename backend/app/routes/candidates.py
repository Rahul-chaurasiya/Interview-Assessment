from fastapi import APIRouter, HTTPException
from app.database import get_db
from typing import Optional, List

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.get("/list")
def list_all_candidates(
    position: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    Get list of all candidates with optional filtering
    
    Args:
        position: Filter by job position
        limit: Max results to return
        offset: Pagination offset
        
    Returns:
        List of candidates with their interview counts
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            if position:
                query = """
                    SELECT c.*,
                           COUNT(i.id) as interview_count,
                           MAX(i.created_at) as last_interview
                    FROM candidates c
                    LEFT JOIN interviews i ON c.id = i.candidate_id
                    WHERE c.position = ?
                    GROUP BY c.id
                    ORDER BY c.created_at DESC
                    LIMIT ? OFFSET ?
                """
                cursor.execute(query, (position, limit, offset))
            else:
                query = """
                    SELECT c.*,
                           COUNT(i.id) as interview_count,
                           MAX(i.created_at) as last_interview
                    FROM candidates c
                    LEFT JOIN interviews i ON c.id = i.candidate_id
                    GROUP BY c.id
                    ORDER BY c.created_at DESC
                    LIMIT ? OFFSET ?
                """
                cursor.execute(query, (limit, offset))
            
            candidates = [dict(row) for row in cursor.fetchall()]
            
            return {
                "success": True,
                "count": len(candidates),
                "candidates": candidates
            }
            
    except Exception as e:
        print(f"❌ Error listing candidates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{candidate_id}")
def get_candidate_details(candidate_id: int):
    """
    Get detailed candidate information with all interviews
    
    Args:
        candidate_id: Candidate ID
        
    Returns:
        Complete candidate profile with interview history
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get candidate
            cursor.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,))
            candidate = cursor.fetchone()
            
            if not candidate:
                raise HTTPException(status_code=404, detail="Candidate not found")
            
            # Get all interviews with scores
            cursor.execute("""
                SELECT i.id, i.audio_path, i.duration, i.status, i.created_at,
                       a.overall_score, a.success_probability, a.grade
                FROM interviews i
                LEFT JOIN assessments a ON i.id = a.interview_id
                WHERE i.candidate_id = ?
                ORDER BY i.created_at DESC
            """, (candidate_id,))
            
            interviews = [dict(row) for row in cursor.fetchall()]
            
            return {
                "success": True,
                "candidate": dict(candidate),
                "interviews": interviews,
                "total_interviews": len(interviews)
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching candidate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/interviews/list")
def list_all_interviews(
    status: Optional[str] = None,
    min_score: Optional[float] = None,
    limit: int = 100
):
    """
    Get list of all interviews with filtering
    
    Args:
        status: Filter by status (uploaded, transcribed, evaluated)
        min_score: Minimum overall score threshold
        limit: Max results
        
    Returns:
        List of interviews with candidate info and scores
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            query = """
                SELECT i.id as interview_id, 
                       c.name as candidate_name,
                       c.email,
                       c.position,
                       i.status,
                       i.created_at,
                       a.overall_score,
                       a.success_probability,
                       a.grade,
                       a.recommendation
                FROM interviews i
                JOIN candidates c ON i.candidate_id = c.id
                LEFT JOIN assessments a ON i.id = a.interview_id
                WHERE 1=1
            """
            
            params = []
            
            if status:
                query += " AND i.status = ?"
                params.append(status)
            
            if min_score is not None:
                query += " AND a.overall_score >= ?"
                params.append(min_score)
            
            query += " ORDER BY i.created_at DESC LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, params)
            
            interviews = [dict(row) for row in cursor.fetchall()]
            
            return {
                "success": True,
                "count": len(interviews),
                "interviews": interviews
            }
            
    except Exception as e:
        print(f"❌ Error listing interviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compare")
def compare_candidates(candidate_ids: str):
    """
    Compare multiple candidates side by side
    
    Args:
        candidate_ids: Comma-separated candidate IDs (e.g., "1,2,3")
        
    Returns:
        Comparison data for all candidates
    """
    try:
        ids = [int(id.strip()) for id in candidate_ids.split(',')]
        
        if len(ids) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 candidate IDs required for comparison"
            )
        
        comparison_data = []
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            for cid in ids:
                # Get candidate with latest assessment
                cursor.execute("""
                    SELECT c.*, i.id as interview_id,
                           a.content_score, a.communication_score,
                           a.confidence_score, a.technical_score,
                           a.overall_score, a.success_probability,
                           a.grade, a.strengths, a.weaknesses
                    FROM candidates c
                    LEFT JOIN interviews i ON c.id = i.candidate_id
                    LEFT JOIN assessments a ON i.id = a.interview_id
                    WHERE c.id = ?
                    ORDER BY a.created_at DESC
                    LIMIT 1
                """, (cid,))
                
                result = cursor.fetchone()
                
                if result:
                    comparison_data.append(dict(result))
        
        return {
            "success": True,
            "candidates_compared": len(comparison_data),
            "comparison": comparison_data
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid candidate IDs format")
    except Exception as e:
        print(f"❌ Error comparing candidates: {e}")
        raise HTTPException(status_code=500, detail=str(e))
