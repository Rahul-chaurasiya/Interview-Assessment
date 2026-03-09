import re
from typing import Dict

class NLPEvaluator:
    """
    PRODUCTION-READY Hybrid NLP Evaluation System
    
    Combines:
    1. Rule-based pattern matching (fast, interpretable)
    2. Transformer-based semantic similarity (accurate, contextual)
    
    Lazy loads transformer model to avoid startup errors.
    """
    
    def __init__(self):
        self.stop_words = {
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'you', 'he', 'she', 'it',
            'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from'
        }
        
        self.fillers = [
            'um', 'uh', 'err', 'erm', 'like', 'you know', 'basically', 'actually',
            'haan', 'na', 'ya', 'bhaiya', 'sir', 'madam', 'uncle', 'aunty'
        ]
        
        # ✅ LAZY LOADING: Don't import/load at init
        self.semantic_model = None
        self.semantic_enabled = False
        self._model_load_attempted = False
        
        print("✅ NLPEvaluator initialized (transformer will load on first use)")
    
    def _load_semantic_model(self):
        """Lazy load Sentence-BERT model on first use"""
        if self._model_load_attempted:
            return
        
        self._model_load_attempted = True
        
        try:
            print("🔄 Loading Sentence-BERT model for semantic analysis...")
            from sentence_transformers import SentenceTransformer
            self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')
            self.semantic_enabled = True
            print("✅ Sentence-BERT model loaded successfully!")
        except ImportError as e:
            print(f"⚠️ sentence-transformers not installed: {e}")
            print("   Install with: pip install sentence-transformers")
            print("   Falling back to rule-based NLP only")
            self.semantic_enabled = False
        except Exception as e:
            print(f"⚠️ Sentence-BERT loading failed: {e}")
            print("   Falling back to rule-based NLP only")
            self.semantic_enabled = False
    
    def evaluate_answer(
        self,
        question: str,
        answer: str,
        reference_answer: str = None
    ) -> Dict:
        """
        Hybrid NLP evaluation combining rule-based and semantic analysis
        """
        
        print(f"\n{'='*60}")
        print(f"📊 NLP EVALUATION START")
        print(f"{'='*60}")
        print(f"Q: {str(question)[:80]}...")
        print(f"A: {str(answer)[:80]}...")
        
        # Handle empty inputs
        if not answer or not question or len(str(answer).strip()) < 3:
            print("❌ Empty/short answer - returning 0 scores")
            return {
                'content_score': 0.0,
                'communication_score': 0.0,
                'confidence_score': 0.0,
                'overall_score': 0.0,
                'details': {
                    'normalized_answer': "",
                    'word_count': 0,
                    'has_technical_terms': False,
                    'reason': 'Empty or too short answer',
                    'suggested_answer': self._generate_suggested_answer(question, reference_answer)
                }
            }
        
        # Normalize
        normalized_answer = self._normalize_answer(str(answer))
        normalized_question = self._normalize_answer(str(question))
        
        word_count = len(normalized_answer.split())
        print(f"Word count: {word_count}")
        
        # ========== LAYER 1: Rule-based NLP ==========
        print("Calculating scores...")
        content_score = self._evaluate_content(normalized_question, normalized_answer)
        print(f"  Content: {content_score:.2f}")
        
        communication_score = self._evaluate_communication(normalized_answer)
        print(f"  Communication: {communication_score:.2f}")
        
        confidence_score = self._evaluate_confidence(normalized_answer)
        print(f"  Confidence: {confidence_score:.2f}")
        
        # ========== LAYER 2: Semantic Similarity (if reference provided) ==========
        if reference_answer and str(reference_answer).strip():
            # ✅ Lazy load model only when needed
            if not self._model_load_attempted:
                self._load_semantic_model()
            
            if self.semantic_enabled:
                reference_normalized = self._normalize_answer(str(reference_answer))
                semantic_score = self._calculate_semantic_similarity(normalized_answer, reference_normalized)
                
                if semantic_score > 0:
                    # ✅ BLEND: 70% rule-based + 30% semantic
                    original_content = content_score
                    content_score = (content_score * 0.7) + (semantic_score * 0.3)
                    print(f"  Semantic boost: {original_content:.2f} → {content_score:.2f}")
        
        # Overall
        overall_score = (content_score + communication_score + confidence_score) / 3
        print(f"✅ Overall: {overall_score:.2f}")
        print(f"{'='*60}\n")
        
        result = {
            'content_score': round(float(content_score), 2),
            'communication_score': round(float(communication_score), 2),
            'confidence_score': round(float(confidence_score), 2),
            'overall_score': round(float(overall_score), 2),
            'details': {
                'normalized_answer': normalized_answer[:200],
                'word_count': len(normalized_answer.split()),
                'has_technical_terms': self._has_technical_content(normalized_answer),
                'suggested_answer': self._generate_suggested_answer(question, reference_answer),
                'semantic_analysis_used': self.semantic_enabled and reference_answer is not None
            }
        }
        
        return result
    
    def _calculate_semantic_similarity(self, answer: str, reference: str) -> float:
        """Calculate semantic similarity using Sentence-BERT transformer"""
        if not self.semantic_enabled or not self.semantic_model:
            return 0.0  # Don't use fallback, just skip
        
        try:
            from sentence_transformers import util
            
            # Generate embeddings
            answer_embedding = self.semantic_model.encode(answer, convert_to_tensor=True)
            ref_embedding = self.semantic_model.encode(reference, convert_to_tensor=True)
            
            # Calculate cosine similarity
            similarity = util.cos_sim(answer_embedding, ref_embedding)
            
            # Convert to 0-100 scale
            score = float(similarity.item()) * 100
            
            print(f"  Semantic similarity: {score:.2f}")
            return min(100.0, max(0.0, score))
        except Exception as e:
            print(f"⚠️ Semantic similarity calculation failed: {e}")
            return 0.0
    
    # ========== ALL OTHER METHODS STAY EXACTLY THE SAME ==========
    
    def _normalize_answer(self, text: str) -> str:
        """Remove fillers while keeping content"""
        if not text:
            return ""
        
        answer = str(text).lower()
        
        for filler in self.fillers:
            pattern = r'\b' + re.escape(filler) + r'\b'
            answer = re.sub(pattern, ' ', answer, flags=re.IGNORECASE)
        
        answer = re.sub(r'\s+', ' ', answer).strip()
        return answer
    
    def _evaluate_content(self, question: str, answer: str) -> float:
        """Content Evaluation (Rule-based)"""
        
        if not answer or len(answer.strip()) == 0:
            return 0.0
        
        score = 40.0  # Base score
        
        # 1. Keyword Relevance (0-30 points)
        q_keywords = self._extract_keywords(question)
        a_keywords = self._extract_keywords(answer)
        
        if q_keywords:
            overlap = len(set(q_keywords) & set(a_keywords))
            relevance_ratio = overlap / len(q_keywords)
            score += relevance_ratio * 30
        else:
            score += 15
        
        # 2. Completeness (0-20 points)
        word_count = len(answer.split())
        if word_count >= 40:
            score += 20
        elif word_count >= 25:
            score += 16
        elif word_count >= 15:
            score += 12
        elif word_count >= 8:
            score += 8
        else:
            score += 4
        
        # 3. Technical Depth (0-10 points)
        tech_bonus = self._calculate_technical_bonus(answer)
        score += tech_bonus
        
        return min(100.0, score)
    
    def _evaluate_communication(self, answer: str) -> float:
        """Communication Evaluation"""
        
        if not answer or len(answer.strip()) == 0:
            return 0.0
        
        score = 50.0  # Base score
        
        # Logical Flow
        logic_patterns = [
            r'\b(because|therefore|thus|so|hence)\b',
            r'\b(first|second|third|finally|lastly)\b',
            r'\b(however|but|although|for example|such as)\b',
            r'\b(if|then|when|while|since)\b'
        ]
        
        logic_count = 0
        for pattern in logic_patterns:
            logic_count += len(re.findall(pattern, answer, flags=re.IGNORECASE))
        
        score += min(25, logic_count * 7)
        
        # Sentence Quality
        sentences = [s.strip() for s in re.split(r'[.!?]+', answer) if len(s.strip()) > 5]
        sentence_count = len(sentences)
        
        if sentence_count >= 4:
            score += 15
        elif sentence_count >= 3:
            score += 12
        elif sentence_count >= 2:
            score += 9
        elif sentence_count >= 1:
            score += 6
        
        # Clarity
        words = answer.split()
        if words:
            avg_word_len = sum(len(w) for w in words) / len(words)
            if avg_word_len < 6:
                score += 10
            elif avg_word_len < 7:
                score += 8
            elif avg_word_len < 9:
                score += 6
            else:
                score += 4
        
        return min(100.0, score)
    
    def _evaluate_confidence(self, answer: str) -> float:
        """Confidence Evaluation"""
        
        if not answer or len(answer.strip()) == 0:
            return 0.0
        
        score = 50.0  # Neutral baseline
        
        # Positive indicators
        confident_patterns = [
            r'\b(i know|i understand|i am confident|clearly|definitely|certainly|absolutely)\b',
            r'\b(i have worked|i have implemented|i have experience|i can|i will)\b',
            r'\b(this is|the answer is|the solution is)\b'
        ]
        
        confidence_boost = 0
        for pattern in confident_patterns:
            confidence_boost += len(re.findall(pattern, answer, flags=re.IGNORECASE)) * 8
        
        score += min(30, confidence_boost)
        
        # Negative indicators
        uncertain_patterns = [
            r'\b(i think|i guess|maybe|perhaps|possibly|probably)\b',
            r'\b(i\'m not sure|i don\'t know|might be|could be)\b'
        ]
        
        uncertainty_penalty = 0
        for pattern in uncertain_patterns:
            uncertainty_penalty += len(re.findall(pattern, answer, flags=re.IGNORECASE)) * 6
        
        score -= min(30, uncertainty_penalty)
        
        return max(30.0, min(100.0, score))
    
    def _calculate_technical_bonus(self, answer: str) -> float:
        """Technical terms bonus"""
        
        tech_pattern = r'\b(algorithm|data structure|complexity|optimization|architecture|framework|database|api|cache|index|transaction|thread|process|memory|network|protocol|encryption|authentication|sql|rest|microservice|container|machine learning|neural network|implementation|performance|scalability|asynchronous|object oriented|inheritance|polymorphism|abstraction|encapsulation)\b'
        
        tech_count = len(re.findall(tech_pattern, answer, flags=re.IGNORECASE))
        
        if tech_count >= 5:
            return 10.0
        elif tech_count >= 3:
            return 8.0
        elif tech_count >= 2:
            return 6.0
        elif tech_count >= 1:
            return 4.0
        else:
            return 0.0
    
    def _has_technical_content(self, answer: str) -> bool:
        """Check for technical terms"""
        if not answer:
            return False
        tech_pattern = r'\b(algorithm|data structure|architecture|database|api|framework|system|implementation)\b'
        return bool(re.search(tech_pattern, answer, flags=re.IGNORECASE))
    
    def _extract_keywords(self, text: str) -> list:
        """Extract meaningful keywords"""
        if not text:
            return []
        words = str(text).lower().split()
        return [w for w in words if w not in self.stop_words and len(w) > 3 and w.replace("'", "").isalpha()]
    
    def _generate_suggested_answer(self, question: str, reference_answer: str = None) -> str:
        """Generate helpful suggestion"""
        
        if reference_answer and str(reference_answer).strip():
            return f"**Suggested Answer:** {reference_answer}"
        
        q_lower = str(question).lower()
        
        suggestions = {
            ('algorithm', 'complexity', 'optimization'): 
                "Explain the algorithm step-by-step, mention time/space complexity (Big O), and discuss optimization strategies.",
            
            ('database', 'sql', 'query'): 
                "Describe the database structure, indexing strategies, normalization, and provide example queries.",
            
            ('design', 'architecture', 'system'): 
                "Start with high-level architecture, break into components, discuss scalability, and mention design patterns.",
            
            ('project', 'experience', 'work'): 
                "Use STAR method: Situation, Task, Action, Result. Include technologies, challenges, and outcomes.",
            
            ('debug', 'troubleshoot', 'error'): 
                "Explain debugging methodology, tools used, how you isolated the issue, and the fix implemented."
        }
        
        for keywords, suggestion in suggestions.items():
            if any(kw in q_lower for kw in keywords):
                return f"**Tip:** {suggestion}"
        
        return "**Tip:** Provide structured answer with clear explanation, examples, and demonstrate deep understanding."

















# import re
# from typing import Dict


# class NLPEvaluator:
#     """
#     PRODUCTION-READY NLP Evaluation System
    
#     Principles:
#     1. Rewards quality over quantity
#     2. Minimum base scores for all valid attempts
#     3. Progressive bonus system
#     4. Fair to both concise and detailed answers
#     """
    
#     def __init__(self):
#         self.stop_words = {
#             'the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'you', 'he', 'she', 'it',
#             'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from'
#         }
        
#         self.fillers = [
#             'um', 'uh', 'err', 'erm', 'like', 'you know', 'basically', 'actually',
#             'haan', 'na', 'ya', 'bhaiya', 'sir', 'madam', 'uncle', 'aunty'
#         ]
    
#     def evaluate_answer(
#         self,
#         question: str,
#         answer: str,
#         reference_answer: str = None
#     ) -> Dict:
#         """
#         Evaluate answer with fair, balanced scoring
#         """
        
#         # Handle empty inputs
#         if not answer or not question or len(str(answer).strip()) < 3:
#             return {
#                 'content_score': 0.0,
#                 'communication_score': 0.0,
#                 'confidence_score': 0.0,
#                 'overall_score': 0.0,
#                 'details': {
#                     'normalized_answer': "",
#                     'word_count': 0,
#                     'has_technical_terms': False,
#                     'reason': 'Empty or too short answer',
#                     'suggested_answer': self._generate_suggested_answer(question, reference_answer)
#                 }
#             }
        
#         # Normalize
#         normalized_answer = self._normalize_answer(str(answer))
#         normalized_question = self._normalize_answer(str(question))
        
#         # Evaluate
#         content_score = self._evaluate_content(normalized_question, normalized_answer)
#         communication_score = self._evaluate_communication(normalized_answer)
#         confidence_score = self._evaluate_confidence(normalized_answer)
        
#         # Reference comparison (if provided)
#         if reference_answer and str(reference_answer).strip():
#             reference_normalized = self._normalize_answer(str(reference_answer))
#             similarity = self._calculate_similarity(normalized_answer, reference_normalized)
#             content_score = (content_score * 0.7) + (similarity * 0.3)
        
#         # Overall
#         overall_score = (content_score + communication_score + confidence_score) / 3
        
#         return {
#             'content_score': round(float(content_score), 2),
#             'communication_score': round(float(communication_score), 2),
#             'confidence_score': round(float(confidence_score), 2),
#             'overall_score': round(float(overall_score), 2),
#             'details': {
#                 'normalized_answer': normalized_answer[:200],
#                 'word_count': len(normalized_answer.split()),
#                 'has_technical_terms': self._has_technical_content(normalized_answer),
#                 'suggested_answer': self._generate_suggested_answer(question, reference_answer)
#             }
#         }
    
#     def _normalize_answer(self, text: str) -> str:
#         """Remove fillers while keeping content"""
#         if not text:
#             return ""
        
#         answer = str(text).lower()
        
#         for filler in self.fillers:
#             pattern = r'\b' + re.escape(filler) + r'\b'
#             answer = re.sub(pattern, ' ', answer, flags=re.IGNORECASE)
        
#         answer = re.sub(r'\s+', ' ', answer).strip()
#         return answer
    
#     def _evaluate_content(self, question: str, answer: str) -> float:
#         """
#         Content Evaluation (Balanced)
        
#         Base: 40 points (for attempting)
#         Keyword relevance: +30 points max
#         Completeness: +20 points max
#         Technical depth: +10 points max
#         """
        
#         if not answer or len(answer.strip()) == 0:
#             return 0.0
        
#         score = 40.0  # ✅ Base score for any valid attempt
        
#         # 1. Keyword Relevance (0-30 points)
#         q_keywords = self._extract_keywords(question)
#         a_keywords = self._extract_keywords(answer)
        
#         if q_keywords:
#             overlap = len(set(q_keywords) & set(a_keywords))
#             relevance_ratio = overlap / len(q_keywords)
#             score += relevance_ratio * 30  # 0-30 points
#         else:
#             score += 15  # Neutral bonus if no question keywords
        
#         # 2. Completeness (0-20 points) - More forgiving
#         word_count = len(answer.split())
#         if word_count >= 40:
#             score += 20
#         elif word_count >= 25:
#             score += 16
#         elif word_count >= 15:
#             score += 12
#         elif word_count >= 8:
#             score += 8
#         else:
#             score += 4  # ✅ Even short answers get partial credit
        
#         # 3. Technical Depth (0-10 points)
#         tech_bonus = self._calculate_technical_bonus(answer)
#         score += tech_bonus
        
#         return min(100.0, score)
    
#     def _evaluate_communication(self, answer: str) -> float:
#         """
#         Communication Evaluation (Balanced)
        
#         Base: 50 points (for structure)
#         Logical flow: +25 points max
#         Sentence quality: +15 points max
#         Clarity: +10 points max
#         """
        
#         if not answer or len(answer.strip()) == 0:
#             return 0.0
        
#         score = 50.0  # ✅ Base score for organized attempt
        
#         # 1. Logical Flow (0-25 points)
#         logic_patterns = [
#             r'\b(because|therefore|thus|so|hence)\b',
#             r'\b(first|second|third|finally|lastly)\b',
#             r'\b(however|but|although|for example|such as)\b',
#             r'\b(if|then|when|while|since)\b'
#         ]
        
#         logic_count = 0
#         for pattern in logic_patterns:
#             logic_count += len(re.findall(pattern, answer, flags=re.IGNORECASE))
        
#         score += min(25, logic_count * 7)  # ✅ 0-25 points
        
#         # 2. Sentence Quality (0-15 points)
#         sentences = [s.strip() for s in re.split(r'[.!?]+', answer) if len(s.strip()) > 5]
#         sentence_count = len(sentences)
        
#         if sentence_count >= 4:
#             score += 15
#         elif sentence_count >= 3:
#             score += 12
#         elif sentence_count >= 2:
#             score += 9
#         elif sentence_count >= 1:
#             score += 6  # ✅ Even single sentence gets credit
        
#         # 3. Clarity (0-10 points)
#         words = answer.split()
#         if words:
#             avg_word_len = sum(len(w) for w in words) / len(words)
#             if avg_word_len < 6:
#                 score += 10
#             elif avg_word_len < 7:
#                 score += 8
#             elif avg_word_len < 9:
#                 score += 6
#             else:
#                 score += 4  # ✅ Still get partial credit
        
#         return min(100.0, score)
    
#     def _evaluate_confidence(self, answer: str) -> float:
#         """
#         Confidence Evaluation (Balanced)
        
#         Base: 50 points (neutral)
#         Confidence indicators: +30 points max
#         Uncertainty penalties: -30 points max
#         """
        
#         if not answer or len(answer.strip()) == 0:
#             return 0.0
        
#         score = 50.0  # ✅ Neutral baseline
        
#         # Positive indicators (+30 max)
#         confident_patterns = [
#             r'\b(i know|i understand|i am confident|clearly|definitely|certainly|absolutely)\b',
#             r'\b(i have worked|i have implemented|i have experience|i can|i will)\b',
#             r'\b(this is|the answer is|the solution is)\b'
#         ]
        
#         confidence_boost = 0
#         for pattern in confident_patterns:
#             confidence_boost += len(re.findall(pattern, answer, flags=re.IGNORECASE)) * 8
        
#         score += min(30, confidence_boost)
        
#         # Negative indicators (-30 max)
#         uncertain_patterns = [
#             r'\b(i think|i guess|maybe|perhaps|possibly|probably)\b',
#             r'\b(i\'m not sure|i don\'t know|might be|could be)\b'
#         ]
        
#         uncertainty_penalty = 0
#         for pattern in uncertain_patterns:
#             uncertainty_penalty += len(re.findall(pattern, answer, flags=re.IGNORECASE)) * 6
        
#         score -= min(30, uncertainty_penalty)
        
#         return max(30.0, min(100.0, score))  # ✅ Min 30, Max 100
    
#     def _calculate_technical_bonus(self, answer: str) -> float:
#         """Technical terms bonus (0-10 points)"""
        
#         tech_pattern = r'\b(algorithm|data structure|complexity|optimization|architecture|framework|database|api|cache|index|transaction|thread|process|memory|network|protocol|encryption|authentication|sql|rest|microservice|container|machine learning|neural network|implementation|performance|scalability|asynchronous|object oriented|inheritance|polymorphism|abstraction|encapsulation)\b'
        
#         tech_count = len(re.findall(tech_pattern, answer, flags=re.IGNORECASE))
        
#         if tech_count >= 5:
#             return 10.0
#         elif tech_count >= 3:
#             return 8.0
#         elif tech_count >= 2:
#             return 6.0
#         elif tech_count >= 1:
#             return 4.0
#         else:
#             return 0.0
    
#     def _has_technical_content(self, answer: str) -> bool:
#         """Check for technical terms"""
#         if not answer:
#             return False
#         tech_pattern = r'\b(algorithm|data structure|architecture|database|api|framework|system|implementation)\b'
#         return bool(re.search(tech_pattern, answer, flags=re.IGNORECASE))
    
#     def _extract_keywords(self, text: str) -> list:
#         """Extract meaningful keywords"""
#         if not text:
#             return []
#         words = str(text).lower().split()
#         return [w for w in words if w not in self.stop_words and len(w) > 3 and w.replace("'", "").isalpha()]
    
#     def _calculate_similarity(self, answer: str, reference: str) -> float:
#         """Similarity to reference (0-100)"""
#         a_words = set(self._extract_keywords(answer))
#         r_words = set(self._extract_keywords(reference))
        
#         if not r_words:
#             return 60.0
#         if not a_words:
#             return 0.0
        
#         overlap = len(a_words & r_words)
#         return min(100.0, (overlap / len(r_words)) * 100)
    
#     def _generate_suggested_answer(self, question: str, reference_answer: str = None) -> str:
#         """Generate helpful suggestion"""
        
#         if reference_answer and str(reference_answer).strip():
#             return f"**Suggested Answer:** {reference_answer}"
        
#         q_lower = str(question).lower()
        
#         suggestions = {
#             ('algorithm', 'complexity', 'optimization'): 
#                 "Explain the algorithm step-by-step, mention time/space complexity (Big O), and discuss optimization strategies.",
            
#             ('database', 'sql', 'query'): 
#                 "Describe the database structure, indexing strategies, normalization, and provide example queries.",
            
#             ('design', 'architecture', 'system'): 
#                 "Start with high-level architecture, break into components, discuss scalability, and mention design patterns.",
            
#             ('project', 'experience', 'work'): 
#                 "Use STAR method: Situation, Task, Action, Result. Include technologies, challenges, and outcomes.",
            
#             ('debug', 'troubleshoot', 'error'): 
#                 "Explain debugging methodology, tools used, how you isolated the issue, and the fix implemented."
#         }
        
#         for keywords, suggestion in suggestions.items():
#             if any(kw in q_lower for kw in keywords):
#                 return f"**Tip:** {suggestion}"
        
#         return "**Tip:** Provide structured answer with clear explanation, examples, and demonstrate deep understanding."
