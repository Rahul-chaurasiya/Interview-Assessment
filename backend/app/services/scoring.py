from typing import Dict, List


class ScoringService:
    """
    PRODUCTION-READY Scoring & Recommendation System
    
    Generates:
    - Overall score & grade
    - Success probability
    - Detailed strengths & weaknesses
    - Actionable recommendations
    - Interview-specific improvement cards
    """
    
    def calculate_overall_score(
        self,
        content_score: float,
        communication_score: float,
        confidence_score: float,
        technical_score: float
    ) -> Dict:
        """
        Calculate comprehensive assessment with detailed feedback
        """
        
        # Weighted overall score
        weights = {
            'content': 0.35,
            'communication': 0.25,
            'confidence': 0.20,
            'technical': 0.20
        }
        
        overall_score = (
            content_score * weights['content'] +
            communication_score * weights['communication'] +
            confidence_score * weights['confidence'] +
            technical_score * weights['technical']
        )
        
        # Grade calculation
        grade = self._calculate_grade(overall_score)
        
        # Success probability
        success_probability = self._calculate_success_probability(overall_score)
        
        # Detailed analysis
        strengths = self._identify_strengths(content_score, communication_score, confidence_score, technical_score)
        weaknesses = self._identify_weaknesses(content_score, communication_score, confidence_score, technical_score)
        
        # Recommendations
        recommendation = self._generate_recommendation(overall_score)
        
        # Improvement cards
        improvement_cards = self._generate_improvement_cards(
            content_score, communication_score, confidence_score, technical_score
        )
        
        # Action plan
        action_plan = self._generate_action_plan(weaknesses)
        
        return {
            'overall_score': round(overall_score, 2),
            'grade': grade,
            'success_probability': round(success_probability, 2),
            'strengths': strengths,
            'weaknesses': weaknesses,
            'recommendation': recommendation,
            'improvement_cards': improvement_cards,
            'action_plan': action_plan,
            'score_breakdown': {
                'content': round(content_score, 2),
                'communication': round(communication_score, 2),
                'confidence': round(confidence_score, 2),
                'technical': round(technical_score, 2)
            }
        }
    
    def _calculate_grade(self, score: float) -> str:
        """Calculate letter grade"""
        if score >= 90:
            return "A+ - Excellent"
        elif score >= 85:
            return "A - Very Good"
        elif score >= 80:
            return "B+ - Good"
        elif score >= 75:
            return "B - Above Average"
        elif score >= 70:
            return "C+ - Average"
        elif score >= 65:
            return "C - Fair"
        elif score >= 60:
            return "D+ - Below Average"
        elif score >= 50:
            return "D - Poor"
        else:
            return "F - Needs Significant Improvement"
    
    def _calculate_success_probability(self, score: float) -> float:
        """Calculate interview success probability"""
        # Non-linear mapping: Higher scores = exponentially better chances
        if score >= 85:
            return 85 + (score - 85) * 1.5  # 85-100 → 85-97.5%
        elif score >= 70:
            return 70 + (score - 70)  # 70-85 → 70-85%
        elif score >= 50:
            return 50 + (score - 50) * 0.8  # 50-70 → 50-66%
        else:
            return score * 0.9  # 0-50 → 0-45%
    
    def _identify_strengths(
        self,
        content: float,
        communication: float,
        confidence: float,
        technical: float
    ) -> str:
        """Identify candidate's strong areas"""
        
        scores = {
            'Content Knowledge': content,
            'Communication Skills': communication,
            'Confidence Level': confidence,
            'Technical Expertise': technical
        }
        
        # Find top strengths (>70)
        strengths = []
        for area, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
            if score >= 75:
                strengths.append(f"{area} ({score:.1f}/100)")
        
        if not strengths:
            # If no score above 75, find best ones
            best = max(scores.items(), key=lambda x: x[1])
            if best[1] >= 60:
                strengths.append(f"{best[0]} ({best[1]:.1f}/100)")
            else:
                return "Shows potential for growth in multiple areas"
        
        # Generate strength statement
        if len(strengths) >= 3:
            return f"Strong in {strengths[0]}, {strengths[1]}, and {strengths[2]}"
        elif len(strengths) == 2:
            return f"Strong in {strengths[0]} and {strengths[1]}"
        elif len(strengths) == 1:
            return f"Strong in {strengths[0]}"
        else:
            return "Demonstrates consistent performance across all areas"
    
    def _identify_weaknesses(
        self,
        content: float,
        communication: float,
        confidence: float,
        technical: float
    ) -> str:
        """Identify areas needing improvement"""
        
        scores = {
            'Content Knowledge': content,
            'Communication Skills': communication,
            'Confidence Level': confidence,
            'Technical Expertise': technical
        }
        
        # Find weaknesses (<65)
        weaknesses = []
        for area, score in sorted(scores.items(), key=lambda x: x[1]):
            if score < 65:
                weaknesses.append(f"{area} ({score:.1f}/100)")
        
        if not weaknesses:
            # If all scores above 65, find lowest ones
            lowest = min(scores.items(), key=lambda x: x[1])
            if lowest[1] < 80:
                weaknesses.append(f"{lowest[0]} could be stronger ({lowest[1]:.1f}/100)")
            else:
                return "Excellent performance - continue current approach"
        
        # Generate weakness statement
        if len(weaknesses) >= 3:
            return f"Needs improvement in {weaknesses[0]}, {weaknesses[1]}, and {weaknesses[2]}"
        elif len(weaknesses) == 2:
            return f"Needs improvement in {weaknesses[0]} and {weaknesses[1]}"
        elif len(weaknesses) == 1:
            return f"Needs improvement in {weaknesses[0]}"
        else:
            return "Minor refinements needed across some areas"
    
    def _generate_recommendation(self, score: float) -> str:
        """Generate hiring recommendation"""
        
        if score >= 85:
            return "🟢 Strongly Recommended - Exceptional candidate with excellent interview performance. Ready for next round or offer."
        elif score >= 75:
            return "🟢 Recommended - Strong candidate demonstrating good technical and communication skills. Proceed to next round."
        elif score >= 65:
            return "🟡 Conditional Recommend - Candidate shows potential but has areas needing development. Consider for junior roles or with training plan."
        elif score >= 55:
            return "🟡 Borderline - Mixed performance. May be suitable for entry-level positions with mentorship and training support."
        elif score >= 45:
            return "🟠 Not Recommended - Significant gaps in multiple areas. Needs substantial improvement before reconsidering."
        else:
            return "🔴 Not Recommended - Does not meet minimum requirements at this time. Encourage reapplication after skill development."
    
    def _generate_improvement_cards(
        self,
        content: float,
        communication: float,
        confidence: float,
        technical: float
    ) -> List[Dict]:
        """
        Generate actionable improvement cards for each component
        """
        
        cards = []
        
        # Content Card
        cards.append({
            'title': 'Content Knowledge',
            'score': round(content, 2),
            'status': self._get_status(content),
            'icon': '📚',
            'tips': self._get_content_tips(content),
            'priority': 'high' if content < 60 else 'medium' if content < 75 else 'low'
        })
        
        # Communication Card
        cards.append({
            'title': 'Communication Skills',
            'score': round(communication, 2),
            'status': self._get_status(communication),
            'icon': '💬',
            'tips': self._get_communication_tips(communication),
            'priority': 'high' if communication < 60 else 'medium' if communication < 75 else 'low'
        })
        
        # Confidence Card
        cards.append({
            'title': 'Confidence Level',
            'score': round(confidence, 2),
            'status': self._get_status(confidence),
            'icon': '💪',
            'tips': self._get_confidence_tips(confidence),
            'priority': 'high' if confidence < 60 else 'medium' if confidence < 75 else 'low'
        })
        
        # Technical Card
        cards.append({
            'title': 'Technical Expertise',
            'score': round(technical, 2),
            'status': self._get_status(technical),
            'icon': '⚙️',
            'tips': self._get_technical_tips(technical),
            'priority': 'high' if technical < 60 else 'medium' if technical < 75 else 'low'
        })
        
        return cards
    
    def _get_status(self, score: float) -> str:
        """Get status label for score"""
        if score >= 85:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 65:
            return "Fair"
        elif score >= 50:
            return "Needs Improvement"
        else:
            return "Critical"
    
    def _get_content_tips(self, score: float) -> List[str]:
        """Generate content improvement tips"""
        tips = []
        
        if score < 70:
            tips.extend([
                "Focus on answering the specific question asked",
                "Provide more detailed explanations with examples",
                "Include relevant keywords and concepts in your answers"
            ])
        
        if score < 80:
            tips.extend([
                "Structure answers with clear beginning, middle, and end",
                "Add concrete examples from your experience"
            ])
        
        if score >= 80:
            tips.append("Excellent content quality - maintain this level")
        
        return tips[:3]  # Return top 3 tips
    
    def _get_communication_tips(self, score: float) -> List[str]:
        """Generate communication improvement tips"""
        tips = []
        
        if score < 70:
            tips.extend([
                "Use transition words (because, therefore, however)",
                "Break complex ideas into multiple sentences",
                "Practice explaining technical concepts simply"
            ])
        
        if score < 80:
            tips.extend([
                "Organize thoughts before speaking using frameworks (STAR method)",
                "Use active voice and direct language"
            ])
        
        if score >= 80:
            tips.append("Strong communication skills - continue refining")
        
        return tips[:3]
    
    def _get_confidence_tips(self, score: float) -> List[str]:
        """Generate confidence improvement tips"""
        tips = []
        
        if score < 70:
            tips.extend([
                "Replace 'I think' with 'I know' when you're certain",
                "Practice answering common interview questions",
                "Use definitive language (definitely, clearly, certainly)"
            ])
        
        if score < 80:
            tips.extend([
                "Share specific examples demonstrating your expertise",
                "Prepare success stories in advance"
            ])
        
        if score >= 80:
            tips.append("Excellent confidence level - very convincing delivery")
        
        return tips[:3]
    
    def _get_technical_tips(self, score: float) -> List[str]:
        """Generate technical improvement tips"""
        tips = []
        
        if score < 70:
            tips.extend([
                "Study core technical concepts for your role",
                "Use technical terminology accurately in answers",
                "Explain concepts with proper technical depth"
            ])
        
        if score < 80:
            tips.extend([
                "Discuss time/space complexity for algorithms",
                "Mention design patterns and best practices"
            ])
        
        if score >= 80:
            tips.append("Strong technical knowledge - excellent depth")
        
        return tips[:3]
    
    def _generate_action_plan(self, weaknesses: str) -> List[Dict]:
        """Generate step-by-step action plan"""
        
        action_items = []
        
        # Parse weaknesses to identify specific areas
        weakness_lower = weaknesses.lower()
        
        if 'content' in weakness_lower:
            action_items.append({
                'area': 'Content Knowledge',
                'priority': 1,
                'actions': [
                    'Review common interview questions for your role',
                    'Practice answering with structured STAR method',
                    'Create a bank of examples from your experience'
                ],
                'timeline': '1-2 weeks'
            })
        
        if 'communication' in weakness_lower:
            action_items.append({
                'area': 'Communication Skills',
                'priority': 2,
                'actions': [
                    'Practice explaining technical concepts to non-technical people',
                    'Record yourself answering questions and review',
                    'Join public speaking groups or practice with friends'
                ],
                'timeline': '2-3 weeks'
            })
        
        if 'confidence' in weakness_lower:
            action_items.append({
                'area': 'Confidence Building',
                'priority': 3,
                'actions': [
                    'Practice mock interviews regularly',
                    'Prepare and memorize key talking points',
                    'Focus on your achievements and strengths'
                ],
                'timeline': '1-2 weeks'
            })
        
        if 'technical' in weakness_lower:
            action_items.append({
                'area': 'Technical Expertise',
                'priority': 1,
                'actions': [
                    'Review fundamental concepts for your domain',
                    'Practice coding problems or technical scenarios',
                    'Study system design patterns and architectures'
                ],
                'timeline': '3-4 weeks'
            })
        
        # If no specific weaknesses, add general improvement
        if not action_items:
            action_items.append({
                'area': 'Overall Performance',
                'priority': 1,
                'actions': [
                    'Continue practicing with varied question types',
                    'Seek feedback from peers and mentors',
                    'Stay updated with industry trends and technologies'
                ],
                'timeline': 'Ongoing'
            })
        
        return action_items
