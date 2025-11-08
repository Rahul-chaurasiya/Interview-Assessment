from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Request Models
class CandidateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    position: str = Field(..., min_length=1, max_length=200)
    phone: Optional[str] = None

class InterviewCreate(BaseModel):
    candidate_id: int
    duration: Optional[float] = None

# Response Models
class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    position: str
    phone: Optional[str]
    created_at: str

class TranscriptionSegment(BaseModel):
    id: Optional[int] = None
    speaker: str
    text: str
    start_time: Optional[float] = 0.0
    end_time: Optional[float] = 0.0
    confidence: Optional[float] = 0.95

class QAPair(BaseModel):
    question: str
    answer: str
    question_time: Optional[float] = 0.0
    answer_time: Optional[float] = 0.0

class AssessmentScores(BaseModel):
    content_score: float
    communication_score: float
    confidence_score: float
    technical_score: float
    overall_score: float
    success_probability: float
    grade: str
    strengths: str
    weaknesses: str
    recommendation: str

class InterviewDetails(BaseModel):
    interview_id: int
    candidate: CandidateResponse
    audio_path: str
    duration: Optional[float]
    status: str
    transcription: List[TranscriptionSegment]
    qa_pairs: List[QAPair]
    assessment: Optional[AssessmentScores] = None
    created_at: str

class InterviewListItem(BaseModel):
    interview_id: int
    candidate_name: str
    position: str
    status: str
    overall_score: Optional[float] = None
    success_probability: Optional[float] = None
    created_at: str
