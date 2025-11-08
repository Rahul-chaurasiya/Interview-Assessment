"""
Explainability Service
----------------------
Generates a clear, human-readable explanation for each interview answer.
Helps judges and recruiters understand *why* a candidate received a score.

✅ Lightweight (no heavy ML model)
✅ Rule-based + keyword-based insight
✅ Can later plug GPT for richer contextual feedback
"""

from typing import Dict, List
import re


class ExplainabilityService:
    def __init__(self):
        # Terms used to detect logical flow or strong statements
        self.logic_terms = ["because", "therefore", "hence", "for example", "in conclusion", "so", "as a result"]
        self.confidence_terms = ["i know", "definitely", "i believe", "certainly", "i have done", "i worked on"]

    def generate_explanation(self, answer: str, scores: Dict[str, float]) -> str:
        """
        Generate an explanation for a given answer based on score metrics and text patterns.
        """

        if not answer or not isinstance(answer, str):
            return "No valid answer provided for explanation."

        explanation_points: List[str] = []

        # --- Content Analysis ---
        if scores.get("content_score", 0) >= 80:
            explanation_points.append("Answer strongly aligned with the question and contained relevant keywords.")
        elif scores.get("content_score", 0) >= 60:
            explanation_points.append("Answer addressed the question but could include more relevant details.")
        else:
            explanation_points.append("Answer lacked clear connection to the question topic.")

        # --- Communication Analysis ---
        logic_count = sum(1 for term in self.logic_terms if term in answer.lower())
        if scores.get("communication_score", 0) >= 80:
            explanation_points.append("The response was logically structured and flowed well.")
        elif logic_count >= 2:
            explanation_points.append("Some logical flow was detected, but organization can improve.")
        else:
            explanation_points.append("The response lacked structure and clear flow of ideas.")

        # --- Confidence Analysis ---
        conf_terms = sum(1 for term in self.confidence_terms if term in answer.lower())
        if scores.get("confidence_score", 0) >= 80 or conf_terms > 0:
            explanation_points.append("Candidate demonstrated strong conviction and self-assurance.")
        elif scores.get("confidence_score", 0) < 50:
            explanation_points.append("Response included hesitant or uncertain expressions.")

        # --- Length-based Detail ---
        word_count = len(answer.split())
        if word_count < 15:
            explanation_points.append("Answer was too short, limiting depth of analysis.")
        elif word_count > 70:
            explanation_points.append("Answer was detailed and covered multiple aspects of the topic.")

        # --- Keyword Extraction for HR context ---
        keywords = [w for w in re.findall(r'\b[a-zA-Z]{5,}\b', answer) if len(w) > 5]
        key_preview = ", ".join(keywords[:6]) if keywords else "N/A"

        # Combine everything into final summary
        explanation = (
            f"🔍 *Explanation Summary:*\n"
            f"- " + "\n- ".join(explanation_points) +
            f"\n\n🗝️ *Key Terms Detected:* {key_preview}"
        )

        return explanation
