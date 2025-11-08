from typing import List, Dict

class QuestionAnswerPairing:
    """
    Pair interviewer questions with candidate answers
    """
    
    def pair_qa(self, diarized_segments: Dict) -> List[Dict]:
        """
        Create question-answer pairs from diarized segments
        
        Args:
            diarized_segments: Dict with 'interviewer' and 'candidate' segments
            
        Returns:
            List of QA pairs
        """
        interviewer = sorted(diarized_segments['interviewer'], key=lambda x: x['start_time'])
        candidate = sorted(diarized_segments['candidate'], key=lambda x: x['start_time'])
        
        pairs = []
        used_answers = set()
        
        for q in interviewer:
            # Find the nearest candidate answer after this question
            matching_answer = None
            min_gap = float('inf')
            
            for idx, a in enumerate(candidate):
                if idx in used_answers:
                    continue
                
                # Answer must come after question
                if a['start_time'] >= q['end_time']:
                    gap = a['start_time'] - q['end_time']
                    if gap < min_gap:
                        min_gap = gap
                        matching_answer = (idx, a)
            
            if matching_answer:
                used_answers.add(matching_answer[0])
                answer_seg = matching_answer[1]
                
                pairs.append({
                    'question': q['text'],
                    'question_time': q['start_time'],
                    'answer': answer_seg['text'],
                    'answer_time': answer_seg['start_time'],
                    'pair_valid': True,
                    'time_gap': answer_seg['start_time'] - q['end_time']
                })
            else:
                # Question without answer
                pairs.append({
                    'question': q['text'],
                    'question_time': q['start_time'],
                    'answer': "[No answer recorded]",
                    'answer_time': 0.0,
                    'pair_valid': False,
                    'time_gap': 0.0
                })
        
        print(f"🔗 Paired {len([p for p in pairs if p['pair_valid']])} question-answer pairs")
        
        return pairs
