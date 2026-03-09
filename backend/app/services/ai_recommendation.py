# services/ai_recommendation.py - Google Gemini Flash Integration
import os
import json
from typing import Dict, List
import re
try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("⚠️ google-genai not installed, using fallback")

class AIRecommendationGenerator:
    """Generate personalized, context-aware interview recommendations using Google Gemini Flash"""
    
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.enabled = False
        
        if not GENAI_AVAILABLE:
            print("⚠️ google-genai library not installed - AI recommendations will use fallback")
            print("   Install with: pip install -q -U google-genai")
        elif not self.gemini_api_key or len(self.gemini_api_key) < 10:
            print("⚠️ No valid Gemini API key configured - AI recommendations will use fallback")
            print("   Get your free API key from: https://aistudio.google.com/app/apikey")
        else:
            try:
                # Initialize the client - API key from environment variable
                self.client = genai.Client()
                self.enabled = True
                print("✅ AI recommendation generator initialized with Google Gemini Flash")
            except Exception as e:
                print(f"⚠️ Failed to initialize Gemini client: {e}")
                print("   AI recommendations will use fallback")
    
    def generate_detailed_feedback(
        self,
        qa_pairs: List[Dict],
        scores: Dict,
        candidate_name: str,
        position: str = "General"
    ) -> Dict:
        """Generate comprehensive, personalized feedback"""
        
        if not self.enabled:
            return self._generate_fallback_feedback(scores, candidate_name, position)
        
        try:
            # Prepare QA pairs text
            qa_text = "\n".join([
                f"Q{i+1}: {qa.get('question', '')}\nA{i+1}: {qa.get('answer', '')}"
                for i, qa in enumerate(qa_pairs)
            ])
            
            # Create detailed prompt
            prompt = self._create_detailed_prompt(qa_text, scores, candidate_name, position)
            
            # Call Gemini API
            response = self._call_ai_api(prompt)
            
            if response:
                # Parse response
                return self._parse_ai_response(response, scores)
            else:
                return self._generate_fallback_feedback(scores, candidate_name, position)
                
        except Exception as e:
            print(f"❌ Error generating AI feedback: {e}")
            return self._generate_fallback_feedback(scores, candidate_name, position)
    
    def _create_detailed_prompt(self, qa_text: str, scores: Dict, candidate_name: str, position: str) -> str:
        """Create comprehensive prompt for AI"""
        
        return f"""As an expert HR interviewer and career coach, analyze this interview performance for {candidate_name} applying for {position} position.

INTERVIEW TRANSCRIPT:
{qa_text}

PERFORMANCE SCORES:
- Content Score: {scores.get('content', 0)}/100
- Communication Score: {scores.get('communication', 0)}/100  
- Confidence Score: {scores.get('confidence', 0)}/100
- Overall Score: {scores.get('overall', 0)}/100

Provide detailed analysis in this exact JSON format:
{{
  "summary": "Brief overall assessment of candidate's performance",
  "strengths": [
    "Specific strength 1 with example from interview",
    "Specific strength 2 with example from interview"
  ],
  "areas_for_improvement": [
    "Specific area 1 with example from interview",
    "Specific area 2 with example from interview"
  ],
  "detailed_feedback": {{
    "technical_knowledge": "Assessment of technical/domain knowledge",
    "communication_skills": "Assessment of verbal communication, clarity, articulation",
    "problem_solving": "Assessment of analytical and problem-solving abilities",
    "cultural_fit": "Assessment of cultural alignment and soft skills"
  }},
  "recommendations": [
    {{
      "category": "Technical Skills",
      "priority": "High|Medium|Low",
      "action": "Specific actionable recommendation",
      "resources": ["resource1", "resource2"]
    }},
    {{
      "category": "Communication", 
      "priority": "High|Medium|Low",
      "action": "Specific actionable recommendation",
      "resources": ["resource1", "resource2"]
    }}
  ],
  "readiness": "Ready now | 3-6 months | 6+ months",
  "next_steps": "Specific actionable next steps for this candidate"
}}"""
    
    def _call_ai_api(self, prompt: str) -> str:
        """Call Gemini Flash API using google-genai library"""
        if not self.enabled:
            print("⚠️ Gemini API not enabled, skipping AI call.")
            return None
        
        try:
            print("🧪 Calling Gemini Flash API...")
            
            # Use the official Google GenAI client
            response = self.client.models.generate_content(
                model="gemini-3-flash-preview", 
                contents=prompt
            )
            
            if response and response.text:
                print("✅ Gemini Flash API success!")
                return response.text
            else:
                raise ValueError("No content in Gemini response")
                
        except Exception as e:
            print(f"❌ Gemini API error: {e}")
            if hasattr(e, 'response') and e.response:
                print(f"Response: {e.response.text}")
        
        print("⚠️ Gemini API call failed, returning None...")
        return None
    
    def _parse_ai_response(self, response: str, scores: Dict) -> Dict:
        """Parse AI response into structured format"""
        
        try:
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                ai_data = json.loads(json_match.group())
                
                # Ensure all required fields exist
                return {
                    "summary": ai_data.get("summary", "Overall performance shows potential for growth"),
                    "strengths": ai_data.get("strengths", ["Good communication skills", "Technical aptitude"]),
                    "areas_for_improvement": ai_data.get("areas_for_improvement", ["Needs more practice", "Improve depth of knowledge"]),
                    "detailed_feedback": ai_data.get("detailed_feedback", {
                        "technical_knowledge": "Adequate technical foundation",
                        "communication_skills": "Clear communication style",
                        "problem_solving": "Logical approach to problems",
                        "cultural_fit": "Good team player attitude"
                    }),
                    "recommendations": ai_data.get("recommendations", [
                        {
                            "category": "Technical Skills",
                            "priority": "Medium",
                            "action": "Practice more technical questions",
                            "resources": ["LeetCode", "Technical blogs"]
                        }
                    ]),
                    "readiness": ai_data.get("readiness", "3-6 months"),
                    "next_steps": ai_data.get("next_steps", "Continue practicing and learning"),
                    "ai_generated": True
                }
            else:
                raise ValueError("No JSON found in response")
                
        except Exception as e:
            print(f"❌ Error parsing AI response: {e}")
            return self._generate_fallback_feedback(scores, "Candidate", "General")
    
    def _generate_fallback_feedback(self, scores: Dict, candidate_name: str, position: str) -> Dict:
        """Generate fallback feedback when AI is not available"""
        
        overall_score = scores.get('overall', 75)
        
        if overall_score >= 85:
            summary = f"{candidate_name} demonstrated excellent performance for the {position} position"
            readiness = "Ready now"
            strengths = ["Strong technical knowledge", "Excellent communication", "Confident responses"]
            improvements = ["Minor areas for refinement"]
        elif overall_score >= 70:
            summary = f"{candidate_name} showed good performance with room for growth for the {position} role"
            readiness = "3-6 months"
            strengths = ["Good foundation", "Clear communication"]
            improvements = ["Needs more depth in technical areas", "Improve confidence"]
        else:
            summary = f"{candidate_name} needs significant preparation for the {position} position"
            readiness = "6+ months"
            strengths = ["Shows potential", "Willing to learn"]
            improvements = ["Requires extensive technical training", "Communication needs improvement", "Build confidence"]
        
        return {
            "summary": summary,
            "strengths": strengths,
            "areas_for_improvement": improvements,
            "detailed_feedback": {
                "technical_knowledge": f"Score: {scores.get('content', 0)}/100",
                "communication_skills": f"Score: {scores.get('communication', 0)}/100",
                "problem_solving": f"Score: {scores.get('confidence', 0)}/100",
                "cultural_fit": "Good potential for cultural alignment"
            },
            "recommendations": [
                {
                    "category": "Technical Skills",
                    "priority": "High" if overall_score < 70 else "Medium",
                    "action": "Practice technical questions and concepts",
                    "resources": ["LeetCode", "Technical documentation", "Online courses"]
                },
                {
                    "category": "Communication",
                    "priority": "High" if overall_score < 70 else "Low",
                    "action": "Practice verbal communication and presentation",
                    "resources": ["Toastmasters", "Practice interviews", "Communication courses"]
                }
            ],
            "readiness": readiness,
            "next_steps": "Focus on identified improvement areas and continue practicing",
            "ai_generated": False
        }

# Initialize global instance
ai_recommender = AIRecommendationGenerator()
