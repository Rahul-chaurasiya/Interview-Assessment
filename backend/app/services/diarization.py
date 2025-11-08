from typing import Dict, List
import re


class SpeakerDiarization:
    """
    IMPROVED speaker diarization:
    - Better interviewer/candidate separation
    - Context-based alternation
    - Fixes false positives ("Yes sir", "Okay", etc.)
    """

    def __init__(self):
        self.interviewer_patterns = [
            r'\b(how|what|why|when|where|which|can you|could you|would you|do you|did you|are you|have you|will you|should)\b',
            r'\b(thank you|thanks|good|great|excellent|awesome|well done|brilliant|perfect|thank|appreciate)\b',
            r'\bi am a (senior|junior|lead|principal|staff|software engineer|manager|cto|founder|head|director)\b',
            r'\bi work (at|for|with|in|as)\b',
            r'\b(interesting|i see|understood|makes sense|right|okay|alright|so)\b.*\b(tell me|explain|describe|let me know)\b',
        ]

        # Candidate reply patterns (to fix “Yes sir”, “Okay sir”, etc.)
        self.candidate_reply_patterns = [
            r'\b(yes|yeah|okay|alright|fine|i am|i\'m|sure|definitely|of course|i have|i worked|i built|i created)\b',
        ]

    def separate_speakers(self, segments: List[Dict]) -> Dict:
        interviewer_segments = []
        candidate_segments = []
        all_segments_updated = []

        for i, seg in enumerate(segments):
            text = seg["text"].strip()
            text_lower = text.lower()
            prev_speaker = segments[i - 1]["speaker"] if i > 0 else "unknown"
            next_text = segments[i + 1]["text"].lower() if i < len(segments) - 1 else ""

            speaker = self._classify_speaker(text_lower, text, prev_speaker, next_text)

            seg_copy = seg.copy()
            seg_copy["speaker"] = speaker
            all_segments_updated.append(seg_copy)

            if speaker == "interviewer":
                interviewer_segments.append(seg_copy)
            else:
                candidate_segments.append(seg_copy)

        print(f"📊 Diarization complete:")
        print(f"   Interviewer segments: {len(interviewer_segments)}")
        print(f"   Candidate segments: {len(candidate_segments)}")

        return {
            "interviewer": interviewer_segments,
            "candidate": candidate_segments,
            "all_segments": all_segments_updated,
        }

    def _classify_speaker(self, text_lower: str, text_original: str, prev_speaker: str, next_text: str) -> str:
        """
        Classification rules with temporal + semantic awareness.
        """

        # RULE 1: Questions are almost always interviewer
        if text_original.strip().endswith("?"):
            return "interviewer"

        # RULE 2: Clear interviewer indicators
        for pattern in self.interviewer_patterns:
            if re.search(pattern, text_lower, flags=re.IGNORECASE):
                if self._is_interviewer_statement(text_lower, text_original):
                    return "interviewer"

        # RULE 3: Candidate confirmation / answer phrases
        for pattern in self.candidate_reply_patterns:
            if re.search(pattern, text_lower):
                if "sir" in text_lower or "project" in text_lower or "i " in text_lower:
                    return "candidate"

        # RULE 4: If previous was interviewer and next is not a question, likely candidate
        if prev_speaker == "interviewer" and not next_text.strip().endswith("?"):
            return "candidate"

        # RULE 5: If previous was candidate and text has question tone, switch back
        if prev_speaker == "candidate" and (
            "?" in text_original or re.search(r'\b(how|what|why|when|where|can)\b', text_lower)
        ):
            return "interviewer"

        # RULE 6: Long explanatory sentences → candidate
        if len(text_lower.split()) > 12 and not text_original.strip().endswith("?"):
            return "candidate"

        # Default fallback
        return "candidate"

    def _is_interviewer_statement(self, text_lower: str, text_original: str) -> bool:
        compliment_words = ["good", "great", "excellent", "awesome", "brilliant", "perfect", "impressive"]
        if any(word in text_lower for word in compliment_words):
            if "you" in text_lower or "your" in text_lower:
                return True

        if re.search(r"\bi am a (senior|junior|lead|engineer|manager)", text_lower):
            return True

        if "thank" in text_lower or "appreciate" in text_lower:
            return True

        return False













# from typing import Dict, List
# import re


# class SpeakerDiarization:
#     """
#     FIXED: Properly separates interviewer from candidate
    
#     Handles:
#     - Questions with and without ?
#     - Compliments/feedback from interviewer
#     - Context-aware classification
#     - Interviewer statements and introductions
#     """
    
#     def __init__(self):
#         # Interviewer patterns (questions, feedback, statements)
#         self.interviewer_patterns = [
#             # Questions
#             r'\b(how|what|why|when|where|which|can you|could you|would you|do you|did you|are you|have you|will you|should)\b',
            
#             # Compliments and feedback
#             r'\b(thank you|thanks|good|great|excellent|awesome|well done|brilliant|perfect|thank|appreciate)\b',
            
#             # Interviewer introduction
#             r'\bi am a (senior|junior|lead|principal|staff|software engineer|manager|cto|founder|head|director)\b',
#             r'\bi work (at|for|with|in|as)\b',
            
#             # Interviewer follow-ups
#             r'\b(interesting|i see|understood|makes sense|right|okay|alright|so)\b.*\b(tell me|explain|describe|let me know)\b',
#         ]
    
#     def separate_speakers(self, segments: List[Dict]) -> Dict:
#         """
#         Classify each segment as interviewer or candidate
        
#         Args:
#             segments: List of transcription segments from Whisper
            
#         Returns:
#             Dict with interviewer, candidate, and all_segments (updated speaker field)
#         """
#         interviewer_segments = []
#         candidate_segments = []
#         all_segments_updated = []
        
#         for i, seg in enumerate(segments):
#             text = seg['text'].strip()
#             text_lower = text.lower()
            
#             # Get previous speaker for context
#             prev_speaker = segments[i-1]['speaker'] if i > 0 else 'unknown'
            
#             # Classify this segment
#             speaker = self._classify_speaker(text_lower, text, prev_speaker)
            
#             # Create copy with updated speaker field
#             seg_copy = seg.copy()
#             seg_copy['speaker'] = speaker
#             all_segments_updated.append(seg_copy)
            
#             # Add to appropriate list
#             if speaker == 'interviewer':
#                 interviewer_segments.append(seg_copy)
#             else:
#                 candidate_segments.append(seg_copy)
        
#         print(f"📊 Diarization Complete")
#         print(f"   Interviewer segments: {len(interviewer_segments)}")
#         print(f"   Candidate segments: {len(candidate_segments)}")
        
#         return {
#             'interviewer': interviewer_segments,
#             'candidate': candidate_segments,
#             'all_segments': all_segments_updated
#         }
    
#     def _classify_speaker(self, text_lower: str, text_original: str, prev_speaker: str) -> str:
#         """
#         IMPROVED: Classify speaker with multiple rules
        
#         Rules (in order):
#         1. Questions (ends with ?) → INTERVIEWER
#         2. Interviewer patterns → INTERVIEWER
#         3. Candidate personal intro → CANDIDATE
#         4. Context-aware (alternate) → Based on previous speaker
#         5. Default → CANDIDATE
#         """
        
#         # RULE 1: Questions always interviewer
#         if text_original.strip().endswith('?'):
#             return 'interviewer'
        
#         # RULE 2: Check interviewer patterns
#         for pattern in self.interviewer_patterns:
#             if re.search(pattern, text_lower, flags=re.IGNORECASE):
#                 # Additional validation: is this really an interviewer statement?
#                 if self._is_interviewer_statement(text_lower, text_original):
#                     return 'interviewer'
        
#         # RULE 3: Candidate personal introduction
#         if re.search(r'\b(my name is|i am|i\'m|i have worked|i have|i worked|i built|i developed|i created)\b', text_lower):
#             return 'candidate'
        
#         # RULE 4: Context-aware (speakers usually alternate)
#         if prev_speaker == 'interviewer':
#             return 'candidate'
#         elif prev_speaker == 'candidate':
#             return 'interviewer'
        
#         # RULE 5: Default to candidate (most content is candidate)
#         return 'candidate'
    
#     def _is_interviewer_statement(self, text_lower: str, text_original: str) -> bool:
#         """
#         Validate if this is actually an interviewer statement
#         (not a candidate accidentally using similar language)
#         """
        
#         # Compliment check - is someone praising another person?
#         compliment_words = ['good', 'great', 'excellent', 'awesome', 'brilliant', 'perfect', 'impressive']
#         if any(word in text_lower for word in compliment_words):
#             # Check if it's directed at someone else (interviewer praising candidate)
#             if 'you' in text_lower or 'your' in text_lower:
#                 return True
        
#         # Interviewer intro - "I am a senior engineer"
#         if re.search(r'\bi am a (senior|junior|lead|engineer|manager)', text_lower):
#             return True
        
#         # Thank you / appreciation
#         if 'thank' in text_lower or 'appreciate' in text_lower:
#             return True
        
#         return False











# from typing import Dict, List


# class SpeakerDiarization:
#     """
#     Separate interviewer questions from candidate answers
#     Uses heuristic-based classification
#     """
    
#     def __init__(self):
#         # Question indicators
#         self.question_starters = [
#             'tell me', 'what', 'why', 'how', 'where', 'when', 'who',
#             'describe', 'explain', 'can you', 'could you', 'would you',
#             'have you', 'do you', 'did you', 'are you', 'were you',
#             'will you', 'should', 'may i', 'let me ask'
#         ]
        
#         # Answer indicators
#         self.answer_starters = [
#             'yes', 'no', 'i think', 'i believe', 'in my opinion',
#             'i have', 'i can', 'i worked', 'my experience', 'i am',
#             'i was', 'i will', 'i would', 'thank you', 'sure'
#         ]
    
#     def separate_speakers(self, segments: List[Dict]) -> Dict:
#         """
#         Classify each segment as interviewer or candidate
        
#         Args:
#             segments: List of transcription segments
            
#         Returns:
#             Dict with separated segments
#         """
#         interviewer_segments = []
#         candidate_segments = []
#         all_segments_with_speaker = []  # ← FIX: Keep original order
        
#         for i, seg in enumerate(segments):
#             text = seg['text'].strip()
#             text_lower = text.lower()
            
#             # Classification logic
#             speaker = self._classify_speaker(text_lower, text, i, len(segments))
            
#             # Create copy with updated speaker
#             seg_copy = seg.copy()
#             seg_copy['speaker'] = speaker
            
#             # Add to all_segments in original order (IMPORTANT!)
#             all_segments_with_speaker.append(seg_copy)
            
#             # Also add to category-specific lists
#             if speaker == 'interviewer':
#                 interviewer_segments.append(seg_copy)
#             else:
#                 candidate_segments.append(seg_copy)
        
#         print(f"📊 Diarization: {len(interviewer_segments)} interviewer, {len(candidate_segments)} candidate segments")
        
#         # ← FIX: Return all_segments in ORIGINAL ORDER with speaker updated
#         return {
#             'interviewer': interviewer_segments,
#             'candidate': candidate_segments,
#             'all_segments': all_segments_with_speaker  # ← FIXED: Maintains original order
#         }
    
#     def _classify_speaker(self, text_lower: str, text_original: str, index: int, total: int) -> str:
#         """
#         Classify a single segment as interviewer or candidate
        
#         Heuristics:
#         1. Questions (ending with ?) → Interviewer
#         2. Starts with question words → Interviewer
#         3. Starts with answer indicators → Candidate
#         4. Short segments (< 10 words) → Likely interviewer
#         5. Otherwise → Candidate (default)
#         """
#         words = text_lower.split()
#         word_count = len(words)
        
#         # Rule 1: Questions (ends with ?)
#         if text_original.strip().endswith('?'):
#             return 'interviewer'
        
#         # Rule 2: Question starters
#         for starter in self.question_starters:
#             if text_lower.startswith(starter):
#                 return 'interviewer'
        
#         # Rule 3: Answer indicators
#         for starter in self.answer_starters:
#             if text_lower.startswith(starter):
#                 return 'candidate'
        
#         # Rule 4: Length-based (questions are usually shorter)
#         if word_count < 5:
#             return 'interviewer'
        
#         # Rule 5: Default to candidate (most of interview is candidate speaking)
#         return 'candidate'
