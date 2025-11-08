import requests
import os
import json
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

class CorrectnessChecker:
    """
    Check technical correctness and factual accuracy of answers
    Uses OpenRouter (GPT-based models) for evaluation
    """

    def __init__(self):
        self.api_key = OPENROUTER_API_KEY
        if not self.api_key or self.api_key == "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":
            print("⚠️ OPENROUTER_API_KEY not configured. Correctness checking will use fallback.")

    def check_correctness(
        self,
        question: str,
        candidate_answer: str,
        reference_answer: str = None,
        job_role: str = "Software Engineer"
    ) -> Dict:
        """
        Evaluate answer correctness using OpenRouter (GPT-like models)

        Args:
            question: The interview question
            candidate_answer: Candidate's response
            reference_answer: Optional reference answer
            job_role: Job position for context

        Returns:
            Dict with correctness_score and reasoning
        """
        if not self.api_key or self.api_key == "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":
            return self._fallback_evaluation(candidate_answer)

        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://yourapp.com",   # Optional: replace with your app URL
                "X-Title": "AI Interview Evaluator"       # Optional: appears in OpenRouter dashboard
            }

            # Construct evaluation prompt
            prompt = f"""You are an expert technical interviewer evaluating a candidate for a {job_role} position.

Question Asked: {question}

Candidate's Answer: {candidate_answer}

{f'Reference Answer: {reference_answer}' if reference_answer else ''}

Evaluate the TECHNICAL CORRECTNESS and ACCURACY of this answer on a scale of 0-100. Consider:
1. Factual accuracy (40%) - Are the facts and technical details correct?
2. Completeness (30%) - Does it address all aspects of the question?
3. Relevance (20%) - Is the answer on-topic?
4. Depth (10%) - Does it show deep understanding?

Provide your evaluation strictly in JSON format:
{{
  "score": <0-100>,
  "reasoning": "<brief explanation of score>",
  "strengths": "<what was good>",
  "improvements": "<what could be better>"
}}"""

            data = {
                "model": "openai/gpt-oss-20b:free",  # You can switch to another OpenRouter model
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert technical interviewer. Evaluate answers objectively and provide structured, JSON-formatted feedback."
                    },
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3
            }

            print("🔍 Checking answer correctness with OpenRouter...")
            response = requests.post(url, headers=headers, json=data, timeout=45)

            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                evaluation = json.loads(content)

                print(f"✅ Correctness score: {evaluation.get('score', 0)}/100")

                return {
                    "correctness_score": float(evaluation.get("score", 75)),
                    "reasoning": evaluation.get("reasoning", ""),
                    "strengths": evaluation.get("strengths", ""),
                    "improvements": evaluation.get("improvements", "")
                }
            else:
                print(f"⚠️ OpenRouter API error {response.status_code}: {response.text}")
                return self._fallback_evaluation(candidate_answer)

        except Exception as e:
            print(f"❌ Correctness check error: {e}")
            return self._fallback_evaluation(candidate_answer)

    def _fallback_evaluation(self, answer: str) -> Dict:
        """Fallback evaluation when API is unavailable"""
        word_count = len(answer.split())

        if word_count > 100:
            score = 85
        elif word_count > 50:
            score = 75
        elif word_count > 20:
            score = 65
        else:
            score = 55

        return {
            "correctness_score": float(score),
            "reasoning": "Fallback evaluation based on answer length and structure",
            "strengths": "Answer provided with reasonable detail",
            "improvements": "Add OPENROUTER_API_KEY for AI-powered evaluation"
        }












# import requests
# import os
# import json
# from typing import Dict
# from dotenv import load_dotenv

# load_dotenv()

# AIPIPE_TOKEN = os.getenv("AIPIPE_TOKEN")

# class CorrectnessChecker:
#     """
#     Check technical correctness and factual accuracy of answers
#     Uses AIPIPE/GPT-4 for evaluation
#     """
    
#     def __init__(self):
#         self.token = AIPIPE_TOKEN
#         if not self.token or self.token == "your_aipipe_token_here":
#             print("⚠️ AIPIPE_TOKEN not configured. Correctness checking will use fallback.")
    
#     def check_correctness(
#         self, 
#         question: str, 
#         candidate_answer: str, 
#         reference_answer: str = None,
#         job_role: str = "Software Engineer"
#     ) -> Dict:
#         """
#         Evaluate answer correctness using AI
        
#         Args:
#             question: The interview question
#             candidate_answer: Candidate's response
#             reference_answer: Optional reference answer
#             job_role: Job position for context
            
#         Returns:
#             Dict with correctness_score and reasoning
#         """
#         if not self.token or self.token == "your_aipipe_token_here":
#             return self._fallback_evaluation(candidate_answer)
        
#         try:
#             url = "https://aipipe.org/openrouter/v1/chat/completions"
#             headers = {
#                 'Authorization': f'Bearer {self.token}',
#                 'Content-Type': 'application/json'
#             }
            
#             # Construct evaluation prompt
#             prompt = f"""You are an expert technical interviewer evaluating a candidate for a {job_role} position.

# Question Asked: {question}

# Candidate's Answer: {candidate_answer}

# {f'Reference Answer: {reference_answer}' if reference_answer else ''}

# Evaluate the TECHNICAL CORRECTNESS and ACCURACY of this answer on a scale of 0-100. Consider:
# 1. Factual accuracy (40%) - Are the facts and technical details correct?
# 2. Completeness (30%) - Does it address all aspects of the question?
# 3. Relevance (20%) - Is the answer on-topic?
# 4. Depth (10%) - Does it show deep understanding?

# Provide your evaluation in JSON format:
# {{
#   "score": <0-100>,
#   "reasoning": "<brief explanation of score>",
#   "strengths": "<what was good>",
#   "improvements": "<what could be better>"
# }}"""
            
#             data = {
#                 'model': 'openai/gpt-4o-mini',
#                 'messages': [
#                     {
#                         'role': 'system',
#                         'content': 'You are an expert technical interviewer. Evaluate answers objectively and provide constructive feedback.'
#                     },
#                     {
#                         'role': 'user',
#                         'content': prompt
#                     }
#                 ],
#                 'response_format': {'type': 'json_object'},
#                 'temperature': 0.3  # Low temperature for consistent evaluation
#             }
            
#             print(f"🔍 Checking answer correctness with AI...")
#             response = requests.post(url, headers=headers, json=data, timeout=30)
            
#             if response.status_code == 200:
#                 result = response.json()
#                 content = result['choices'][0]['message']['content']
#                 evaluation = json.loads(content)
                
#                 print(f"✅ Correctness score: {evaluation.get('score', 0)}/100")
                
#                 return {
#                     'correctness_score': float(evaluation.get('score', 75)),
#                     'reasoning': evaluation.get('reasoning', ''),
#                     'strengths': evaluation.get('strengths', ''),
#                     'improvements': evaluation.get('improvements', '')
#                 }
#             else:
#                 print(f"⚠️ API error {response.status_code}, using fallback")
#                 return self._fallback_evaluation(candidate_answer)
                
#         except Exception as e:
#             print(f"❌ Correctness check error: {e}")
#             return self._fallback_evaluation(candidate_answer)
    
#     def _fallback_evaluation(self, answer: str) -> Dict:
#         """
#         Fallback evaluation when API is unavailable
#         Uses simple heuristics
#         """
#         word_count = len(answer.split())
        
#         # Simple heuristic: longer, detailed answers score higher
#         if word_count > 100:
#             score = 85
#         elif word_count > 50:
#             score = 75
#         elif word_count > 20:
#             score = 65
#         else:
#             score = 55
        
#         return {
#             'correctness_score': float(score),
#             'reasoning': 'Fallback evaluation based on answer length and structure',
#             'strengths': 'Answer provided with reasonable detail',
#             'improvements': 'Add AIPIPE_TOKEN for AI-powered evaluation'
#         }
