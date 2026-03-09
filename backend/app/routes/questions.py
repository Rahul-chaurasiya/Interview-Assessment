
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from app.services import questions as questions_service

router = APIRouter(prefix="/questions", tags=["Questions"])


# =====================================================
# Request/Response Models
# =====================================================

class QuestionGenerateRequest(BaseModel):
    role: str
    categories: List[str]
    difficulty: str
    question_count: int
    shuffle: bool = True


class QuestionResponse(BaseModel):
    id: int
    category: str
    role: str
    topic: str
    difficulty: str
    question_text: str
    ideal_answer: Optional[str] = None


class RoleResponse(BaseModel):
    id: str
    name: str


# =====================================================
# API Endpoints
# =====================================================

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles():
    """
    Get all available roles for interview questions
    """
    try:
        roles = questions_service.get_all_roles()
        return roles
    except Exception as e:
        print(f"❌ Error fetching roles: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_categories():
    """
    Get all question categories
    """
    try:
        categories = questions_service.get_all_categories()
        return {"categories": categories}
    except Exception as e:
        print(f"❌ Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/topics")
async def get_topics(
    category: str = Query(..., description="Question category"),
    role: Optional[str] = Query(None, description="Filter by role")
):
    """
    Get topics for a specific category
    """
    try:
        topics = questions_service.get_topics_for_category(category, role)
        return {"topics": topics}
    except Exception as e:
        print(f"❌ Error fetching topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[QuestionResponse])
async def get_questions(
    role: Optional[str] = Query(None, description="Filter by role"),
    category: Optional[str] = Query(None, description="Filter by category"),
    topic: Optional[str] = Query(None, description="Filter by topic"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    limit: int = Query(50, description="Maximum number of questions")
):
    """
    Get filtered questions from the question bank
    """
    try:
        questions = questions_service.get_questions(
            role=role,
            category=category,
            topic=topic,
            difficulty=difficulty,
            limit=limit
        )
        return questions
    except Exception as e:
        print(f"❌ Error fetching questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate", response_model=List[QuestionResponse])
async def generate_question_set(request: QuestionGenerateRequest):
    """
    Generate a set of questions based on role, categories, difficulty, and count
    """
    try:
        if request.question_count < 1 or request.question_count > 50:
            raise HTTPException(status_code=400, detail="Question count must be between 1 and 50")
        
        questions = questions_service.generate_question_set(
            role=request.role,
            categories=request.categories,
            difficulty=request.difficulty,
            question_count=request.question_count,
            shuffle=request.shuffle
        )
        return questions
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/interview/{interview_id}", response_model=List[QuestionResponse])
async def get_interview_questions(interview_id: int):
    """
    Get questions assigned to a specific interview
    """
    try:
        questions = questions_service.get_interview_questions(interview_id)
        return questions
    except Exception as e:
        print(f"❌ Error fetching interview questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interview/{interview_id}")
async def assign_questions_to_interview(
    interview_id: int,
    questions: List[QuestionResponse]
):
    """
    Assign questions to an interview
    """
    try:
        # Convert Pydantic models to dicts
        questions_dicts = [q.dict() for q in questions]
        questions_service.assign_questions_to_interview(interview_id, questions_dicts)
        return {"success": True, "message": f"Assigned {len(questions)} questions to interview {interview_id}"}
    except Exception as e:
        print(f"❌ Error assigning questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/interview/{interview_id}/question/{question_id}")
async def update_question_status(
    interview_id: int,
    question_id: int,
    asked: Optional[bool] = None,
    answered: Optional[bool] = None
):
    """
    Update the status of a question in an interview
    """
    try:
        questions_service.update_question_status(interview_id, question_id, asked, answered)
        return {"success": True, "message": "Question status updated"}
    except Exception as e:
        print(f"❌ Error updating question status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

