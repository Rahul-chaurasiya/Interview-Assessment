"""
Emotion Analysis Service
------------------------
Performs lightweight tone and emotion detection from candidate's audio.
Currently uses heuristic simulation for hackathon demos — can integrate
a real Speech Emotion Recognition (SER) model later.

✅ Detects tone-based confidence
✅ Adjusts overall confidence score
✅ Adds personality insight (visual emoji output)
"""

import random
from typing import Dict


class EmotionAnalysisService:
    EMOTIONS = {
        "confident": {"range": (80, 95), "emoji": "🟢", "desc": "Confident, assertive tone detected."},
        "neutral": {"range": (65, 80), "emoji": "🔵", "desc": "Calm and balanced tone throughout."},
        "nervous": {"range": (45, 65), "emoji": "🟠", "desc": "Slight tension or hesitation detected."},
        "uncertain": {"range": (30, 50), "emoji": "🔴", "desc": "Uncertain or unsteady speech pattern observed."}
    }

    def analyze_emotion(self, audio_path: str) -> Dict:
        """
        Analyze candidate's voice tone and return an estimated emotion/confidence score.
        For now, this randomly simulates analysis (demo-friendly).
        """

        # Randomly choose an emotion type for simulation
        emotion = random.choice(list(self.EMOTIONS.keys()))
        data = self.EMOTIONS[emotion]

        # Generate confidence boost score within the emotion's range
        confidence_boost = random.randint(*data["range"])

        print(f"🎭 Emotion analysis result for {audio_path}: {emotion} ({confidence_boost}%)")

        return {
            "emotion": emotion,
            "confidence_boost": confidence_boost,
            "emoji": data["emoji"],
            "description": data["desc"]
        }
