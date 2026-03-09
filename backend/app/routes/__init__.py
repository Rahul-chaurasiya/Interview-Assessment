"""
API Routes
Clean architecture for interview assessment system
"""
from .interview import router as interview_router
from .assessment import router as assessment_router
from .candidates import router as candidates_router
from . import history
from . import dashboard
from . import transcription
from .questions import router as questions_router
from .live_interview import router as live_interview_router
from .config import router as config_router

__all__ = [
    'interview_router', 
    'assessment_router', 
    'candidates_router',
    'history',
    'dashboard', 
    'transcription',
    'questions_router',
    'live_interview_router',
    'config_router'
]
