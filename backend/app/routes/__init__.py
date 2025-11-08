"""
API Routes
"""
from .interview import router as interview_router
from .assessment import router as assessment_router
from .candidates import router as candidates_router

__all__ = ['interview_router', 'assessment_router', 'candidates_router']
