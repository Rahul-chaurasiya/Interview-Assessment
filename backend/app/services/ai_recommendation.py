# services/ai_recommendation.py - COMPLETE FIXED VERSION
import os
import json
import requests
from typing import Dict, List
import re

class AIRecommendationGenerator:
    """Generate personalized, context-aware interview recommendations using AI"""
    
    def __init__(self):  # ✅ FIXED: Was _init_ (single underscore)
        self.api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.enabled = bool(self.api_key)
        
        if not self.enabled:
            print("⚠️ OPENROUTER_API_KEY not set - AI recommendations will use fallback")
        else:
            print("✅ AI recommendation generator initialized")
    
    def generate_detailed_feedback(
        self,
        qa_pairs: List[Dict],
        scores: Dict,
        candidate_name: str,
        position: str = "General"
    ) -> Dict:
        """Generate comprehensive, personalized feedback"""
        
        if not self.enabled:
            print("ℹ️ Using fallback recommendations (AI disabled)")
            return self._generate_fallback_recommendation(scores, position)
        
        try:
            print("🤖 Generating AI-powered personalized recommendations...")
            
            # Build context
            interview_context = self._build_interview_context(qa_pairs, scores, candidate_name, position)
            
            # Call AI API
            response = self._call_ai_api(interview_context)
            
            # Parse response
            recommendation = self._parse_ai_response(response, scores)
            
            print("✅ AI recommendations generated successfully!")
            return recommendation
            
        except Exception as e:
            print(f"⚠️ AI recommendation generation failed: {e}")
            print("   Falling back to rule-based recommendations")
            return self._generate_fallback_recommendation(scores, position)
    
    def _build_interview_context(self, qa_pairs: List[Dict], scores: Dict, candidate_name: str, position: str) -> str:
        """Build detailed context for AI"""
        
        qa_sample = ""
        for i, pair in enumerate(qa_pairs[:4], 1):
            question = pair.get('question', '')
            answer = pair.get('answer', '')
            qa_sample += f"\nQ{i}: {question}\nA{i}: {answer}\n"
        
        if not qa_sample.strip():
            qa_sample = "\n[No Q&A pairs available for analysis]"
        
        prompt = f"""You are an expert HR interviewer analyzing an interview assessment.

**Candidate:** {candidate_name}
**Position:** {position}

**Performance Scores:**
- Content Knowledge: {scores.get('content_score', 0):.1f}/100
- Communication Skills: {scores.get('communication_score', 0):.1f}/100
- Confidence Level: {scores.get('confidence_score', 0):.1f}/100
- Technical Accuracy: {scores.get('technical_score', 0):.1f}/100
- Overall Score: {scores.get('overall_score', 0):.1f}/100

**Interview Sample:**
{qa_sample}

**Task:** Generate a comprehensive, professional interview assessment.

Return response as valid JSON with this exact structure:
{{
  "decision": "Strong Hire | Hire | Conditional Hire | Not Recommended",
  "summary": "2-3 sentence overview",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["area 1", "area 2", "area 3"],
  "development_plan": [
    {{"area": "Technical Knowledge", "action": "specific action", "resources": ["resource1", "resource2"]}},
    {{"area": "Communication", "action": "specific action", "resources": ["resource1"]}}
  ],
  "readiness": "Ready now | 3-6 months | 6+ months",
  "next_steps": "Specific actionable next steps"
}}
"""
        return prompt
    
    def _call_ai_api(self, prompt: str) -> str:
        """Call OpenRouter API"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1500,
        }
        
        response = requests.post(self.api_url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    
    def _parse_ai_response(self, response: str, scores: Dict) -> Dict:
        """Parse AI response into structured format"""
        
        try:
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                ai_data = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in AI response")
            
            ai_data['overall_score'] = scores.get('overall_score', 0)
            ai_data['icon'] = self._get_decision_icon(ai_data.get('decision', 'Conditional Hire'))
            ai_data['color'] = self._get_decision_color(ai_data.get('decision', 'Conditional Hire'))
            ai_data['ai_generated'] = True
            
            return ai_data
            
        except Exception as e:
            print(f"⚠️ Failed to parse AI response: {e}")
            return self._generate_fallback_recommendation(scores, "General")
    
    def _get_decision_icon(self, decision: str) -> str:
        """Get icon for decision"""
        decision_lower = decision.lower()
        if "strong hire" in decision_lower:
            return "🌟"
        elif "hire" in decision_lower and "not" not in decision_lower:
            return "✅"
        elif "conditional" in decision_lower:
            return "⚠️"
        else:
            return "❌"
    
    def _get_decision_color(self, decision: str) -> str:
        """Get color for decision"""
        decision_lower = decision.lower()
        if "strong hire" in decision_lower:
            return "#10b981"
        elif "hire" in decision_lower and "not" not in decision_lower:
            return "#3b82f6"
        elif "conditional" in decision_lower:
            return "#f59e0b"
        else:
            return "#ef4444"
    
    def _generate_fallback_recommendation(self, scores: Dict, position: str) -> Dict:
        """Fallback when AI unavailable"""
        overall = scores.get('overall_score', 0)
        content = scores.get('content_score', 0)
        comm = scores.get('communication_score', 0)
        conf = scores.get('confidence_score', 0)
        
        if overall >= 85:
            decision = "Strong Hire"
            summary = f"Exceptional performance across all evaluation criteria. Highly recommended for {position} role."
        elif overall >= 70:
            decision = "Hire"
            summary = f"Solid candidate with strong fundamentals. Good fit for {position} role."
        elif overall >= 55:
            decision = "Conditional Hire"
            summary = f"Shows potential but requires development. Consider for junior {position} roles with mentorship."
        else:
            decision = "Not Recommended"
            summary = f"Significant gaps in core competencies. Additional preparation needed for {position} role."
        
        strengths = []
        if conf >= 70:
            strengths.append(f"Demonstrates strong confidence (Score: {conf:.1f})")
        if content >= 70:
            strengths.append(f"Shows good technical knowledge (Score: {content:.1f})")
        if comm >= 70:
            strengths.append(f"Communicates clearly (Score: {comm:.1f})")
        if not strengths:
            strengths.append("Review individual scores for specific performance insights")
        
        weaknesses = []
        if content < 60:
            weaknesses.append(f"Technical knowledge needs strengthening (Score: {content:.1f})")
        if comm < 60:
            weaknesses.append(f"Communication clarity could be improved (Score: {comm:.1f})")
        if conf < 60:
            weaknesses.append(f"Confidence level needs development (Score: {conf:.1f})")
        if not weaknesses:
            weaknesses.append("Minor improvements in consistency recommended")
        
        development_plan = []
        if content < 70:
            development_plan.append({
                "area": "Technical Knowledge",
                "action": "Study core concepts and practice explaining technical topics",
                "resources": ["Online courses", "Technical books", "Practice interviews"]
            })
        if comm < 70:
            development_plan.append({
                "area": "Communication",
                "action": "Practice structured answering using STAR method",
                "resources": ["Communication workshops", "Mock interviews"]
            })
        
        if overall >= 70:
            readiness = "Ready now"
            next_steps = "Proceed with next interview rounds or offer discussion"
        elif overall >= 55:
            readiness = "3-6 months"
            next_steps = "Focus on identified development areas, then reassess"
        else:
            readiness = "6+ months"
            next_steps = "Substantial preparation needed in core competencies"
        
        return {
            "decision": decision,
            "summary": summary,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "development_plan": development_plan,
            "readiness": readiness,
            "next_steps": next_steps,
            "icon": self._get_decision_icon(decision),
            "color": self._get_decision_color(decision),
            "ai_generated": False
        }

# ✅ Create global instance
ai_recommendation_generator = AIRecommendationGenerator()
