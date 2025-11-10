# backend/app/routes/assessment_from_transcript.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re

router = APIRouter(prefix="/assessment", tags=["Assessment"])

class TranscriptPayload(BaseModel):
    transcript: str
    candidate_id: int = None

# Try to import your real ScoringService; fallback to stub
try:
    from app.services.scoring import ScoringService
    scoring_available = True
except Exception:
    scoring_available = False
    ScoringService = None

def naive_scores_from_transcript(text: str):
    """
    Quick heuristics demo — not production.
    - content_score: length and technical-word density
    - communication_score: average sentence length & filler word penalty
    - confidence_score: presence of hedges and filler words
    - technical_score: count of code/tech keywords (simple)
    """
    if not text:
        return 30, 30, 30, 30

    words = re.findall(r"\w+", text.lower())
    length = len(words)
    # simple list of technical keywords
    tech_words = {"algorithm","data","python","react","api","database","sql","server","model","training","accuracy","error"}
    tech_count = sum(1 for w in words if w in tech_words)

    # filler and hedges
    fillers = {"um","uh","like","you know","i think","maybe"}
    filler_count = sum(1 for w in words if w in fillers)

    content_score = min(95, 30 + int(length / 10) + tech_count * 5)
    communication_score = max(30, min(95, 80 - filler_count * 5 - abs((length/ (len(text.split("."))+1)) - 14)))
    confidence_score = max(25, 90 - filler_count * 6)
    technical_score = min(95, 30 + tech_count * 8 + int(length/50))

    return content_score, communication_score, confidence_score, technical_score

@router.post("/evaluate")
async def evaluate(payload: TranscriptPayload):
    transcript = payload.transcript or ""
    # Prefer your real scoring pipeline if present
    if scoring_available:
        svc = ScoringService()
        # we attempt to use any NLP module you may have to compute sub-scores.
        # If your NLPEvaluator exists, use it. Else, fall back to naive.
        try:
            from app.services.nlp_evaluation import NLPEvaluator
            evaluator = NLPEvaluator()
            # NLPEvaluator should provide component scores; adapt as needed
            comp_scores = evaluator.evaluate_components(transcript)
            content = comp_scores.get("content", 70)
            communication = comp_scores.get("communication", 70)
            confidence = comp_scores.get("confidence", 70)
            technical = comp_scores.get("technical", 70)
        except Exception:
            content, communication, confidence, technical = naive_scores_from_transcript(transcript)

        result = svc.calculate_overall_score(content, communication, confidence, technical)
        return result

    # fallback naive scoring
    content, communication, confidence, technical = naive_scores_from_transcript(transcript)
    # Construct a simple response matching your scoring return shape
    overall = round((content*0.35 + communication*0.25 + confidence*0.2 + technical*0.2), 2)
    # produces a grade roughly
    def grade_from(score):
        if score >= 90: return "A+"
        if score >= 80: return "A"
        if score >= 70: return "B"
        if score >= 60: return "C"
        return "D/F"
    return {
        "overall_score": overall,
        "grade": grade_from(overall),
        "success_probability": round(min(99, overall),2),
        "strengths": "Auto-detected strengths (demo).",
        "weaknesses": "Auto-detected weaknesses (demo).",
        "recommendation": "Use this candidate for next steps (demo).",
        "improvement_cards": [],
        "action_plan": [],
        "score_breakdown": {
            "content": round(content,2),
            "communication": round(communication,2),
            "confidence": round(confidence,2),
            "technical": round(technical,2),
        }
    }