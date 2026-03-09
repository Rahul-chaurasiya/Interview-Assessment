try:
    import whisper
except ImportError:
    whisper = None
import os
from pathlib import Path
from typing import Dict
from dotenv import load_dotenv
import traceback
import subprocess

# =============================================================
# Load environment variables
# =============================================================
load_dotenv()

# =============================================================
# Fix: Ensure FFmpeg path is available to Whisper
# =============================================================
# derive path relative to this file in case drive letters change
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FFMPEG_PATH = BASE_DIR / "ffmpeg-binaries" / "ffmpeg-master-latest-win64-gpl" / "bin"
if FFMPEG_PATH.exists():
    os.environ["PATH"] += os.pathsep + str(FFMPEG_PATH)
    print(f"✅ FFmpeg path added: {FFMPEG_PATH}")
else:
    print(f"⚠️ FFmpeg path not found at {FFMPEG_PATH}. Make sure ffmpeg.exe exists there.")

# =============================================================
# Load Whisper configuration
# =============================================================
USE_LOCAL_WHISPER = os.getenv("USE_LOCAL_WHISPER", "true").lower() == "true"
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")


class TranscriptionService:
    """
    REAL audio transcription using OpenAI Whisper
    This processes the actual audio content.
    """

    def __init__(self):
        if USE_LOCAL_WHISPER:
            try:
                print(f"🔄 Loading Whisper '{WHISPER_MODEL_SIZE}' model (first time may take a few minutes)...")
                self.model = whisper.load_model(WHISPER_MODEL_SIZE)
                print(f"✅ Whisper '{WHISPER_MODEL_SIZE}' model loaded successfully!")
            except Exception as e:
                print(f"❌ Failed to load Whisper model: {e}")
                self.model = None
        else:
            self.model = None
            print("⚠️ Local Whisper disabled. Set USE_LOCAL_WHISPER=true in .env")

    def extract_audio_from_video(self, video_path: str) -> str:
        """
        Extract audio from video file using FFmpeg
        Returns path to extracted audio file
        """
        try:
            video_path = Path(video_path)
            audio_output_path = video_path.parent / f"{video_path.stem}_extracted.wav"
            
            print(f"🎬 Extracting audio from video: {video_path}")
            print(f"🎵 Output audio path: {audio_output_path}")
            
            # Use FFmpeg to extract audio
            cmd = [
                'ffmpeg',
                '-i', str(video_path),
                '-vn',  # No video
                '-acodec', 'pcm_s16le',  # Audio codec
                '-ar', '16000',  # Sample rate for Whisper
                '-ac', '1',  # Mono channel
                '-y',  # Overwrite output file
                str(audio_output_path)
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )
            
            if result.returncode == 0:
                print(f"✅ Audio extracted successfully: {audio_output_path}")
                return str(audio_output_path)
            else:
                print(f"❌ FFmpeg error: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"❌ Error extracting audio from video: {e}")
            return None

    def transcribe_audio(self, audio_path: str) -> Dict:
        """
        Transcribe audio file using Whisper
        Returns REAL transcription from actual audio content.
        """
        original_audio_path = audio_path
        audio_path = audio_path.replace("\\", "/")

        print(f"\n{'='*60}")
        print(f"🎙️ TRANSCRIPTION SERVICE")
        print(f"{'='*60}")
        print(f"   Original path: {original_audio_path}")
        print(f"   Normalized path: {audio_path}")

        # -------------------------------------------------------------
        # Step 1: Try to locate the audio file robustly
        # -------------------------------------------------------------
        possible_paths = [
            audio_path,
            os.path.join("app", audio_path),
            os.path.join("backend", "app", audio_path),
            os.path.join("backend", "app", "uploads", Path(audio_path).name),
            os.path.join("app", "uploads", Path(audio_path).name),
            os.path.join("uploads", Path(audio_path).name),
        ]

        found_path = None
        for p in possible_paths:
            abs_path = Path(p).resolve()
            if abs_path.exists():
                found_path = str(abs_path)
                print(f"✅ Found file at: {found_path}")
                break

        if not found_path:
            print("❌ File not found in any of the checked locations:")
            for p in possible_paths:
                print(f"   - {Path(p).resolve()}")
            print(f"{'='*60}\n")
            return self._error_response(f"Audio file not found: {original_audio_path}")

        # -------------------------------------------------------------
        # Step 1.5: Check if file is video and extract audio if needed
        # -------------------------------------------------------------
        file_extension = Path(found_path).suffix.lower()
        video_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
        
        if file_extension in video_extensions:
            print(f"🎬 Video file detected: {file_extension}")
            extracted_audio_path = self.extract_audio_from_video(found_path)
            
            if not extracted_audio_path:
                print("❌ Failed to extract audio from video")
                print(f"{'='*60}\n")
                return self._error_response("Failed to extract audio from video")
            
            # Use extracted audio for transcription
            found_path = extracted_audio_path
            print(f"🎵 Using extracted audio: {found_path}")

        # -------------------------------------------------------------
        # Step 2: Ensure Whisper model is loaded
        # -------------------------------------------------------------
        if not self.model:
            print(f"❌ Whisper model not loaded")
            print(f"{'='*60}\n")
            return self._error_response("Whisper model not loaded. Please ensure USE_LOCAL_WHISPER=true in .env")

        # -------------------------------------------------------------
        # Step 3: Start transcription
        # -------------------------------------------------------------
        try:
            print(f"🎧 Using audio file: {found_path}")
            print("🔍 File exists:", os.path.exists(found_path))
            print(f"📦 File size: {os.path.getsize(found_path) / 1024:.2f} KB")

            result = self.model.transcribe(
                found_path,
                language="en",
                task="transcribe",
                verbose=False,
                fp16=False  # Disable FP16 for CPU systems
            )

            segments = []
            for seg in result.get("segments", []):
                segments.append({
                    "speaker": "candidate",
                    "text": seg["text"].strip(),
                    "start_time": float(seg["start"]),
                    "end_time": float(seg["end"]),
                    "confidence": 0.95
                })

            full_text = result["text"].strip()

            print(f"\n✅ TRANSCRIPTION SUCCESS")
            print(f"   Segments: {len(segments)}")
            print(f"   Total characters: {len(full_text)}")
            print(f"   Language: {result.get('language', 'en')}")
            print(f"   Preview: {full_text[:100]}...")
            print(f"{'='*60}\n")

            return {
                "segments": segments,
                "full_text": full_text,
                "source": "whisper_local",
                "language": result.get("language", "en"),
                "duration": result.get("duration", 0.0)
            }

        except Exception as e:
            print(f"\n❌ TRANSCRIPTION ERROR")
            print(f"   Error: {e}")
            traceback.print_exc()
            print(f"{'='*60}\n")
            return self._error_response(str(e))

    def _error_response(self, error_msg: str) -> Dict:
        """Return standardized error response"""
        return {
            "segments": [],
            "full_text": "",
            "source": "error",
            "error": error_msg
        }























# import whisper
# import os
# from pathlib import Path
# from typing import Dict, List
# from dotenv import load_dotenv

# load_dotenv()

# USE_LOCAL_WHISPER = os.getenv("USE_LOCAL_WHISPER", "true").lower() == "true"
# WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")

# class TranscriptionService:
#     """
#     REAL audio transcription using OpenAI Whisper
#     This actually processes the audio content!
#     """
    
#     def __init__(self):
#         if USE_LOCAL_WHISPER:
#             try:
#                 print(f"🔄 Loading Whisper '{WHISPER_MODEL_SIZE}' model (first time may take a few minutes)...")
#                 self.model = whisper.load_model(WHISPER_MODEL_SIZE)
#                 print(f"✅ Whisper '{WHISPER_MODEL_SIZE}' model loaded successfully!")
#             except Exception as e:
#                 print(f"❌ Failed to load Whisper model: {e}")
#                 self.model = None
#         else:
#             self.model = None
#             print("⚠️ Local Whisper disabled. Set USE_LOCAL_WHISPER=true in .env")
    
#     def transcribe_audio(self, audio_path: str) -> Dict:
#         """
#         Transcribe audio file using Whisper
#         Returns REAL transcription from actual audio content
        
#         Args:
#             audio_path: Path to audio file (can be relative or absolute)
            
#         Returns:
#             Dict with segments, full_text, and metadata
#         """
#         # Store original path for error messages
#         original_audio_path = audio_path
        
#         # Step 1: Normalize path - convert all backslashes to forward slashes
#         audio_path = audio_path.replace('\\', '/')
        
#         print(f"\n{'='*60}")
#         print(f"🎙️ TRANSCRIPTION SERVICE")
#         print(f"{'='*60}")
#         print(f"   Original path: {original_audio_path}")
#         print(f"   Normalized path: {audio_path}")
        
#         # Step 2: Check if file exists with the given path (relative)
#         if os.path.exists(audio_path):
#             print(f"   ✅ File found at relative path")
#         else:
#             print(f"   ❌ File not found at relative path, trying absolute path...")
            
#             # Step 3: Try to resolve to absolute path if relative doesn't work
#             try:
#                 abs_path = str(Path(audio_path).resolve()).replace('\\', '/')
#                 print(f"   Trying absolute: {abs_path}")
                
#                 if os.path.exists(abs_path):
#                     audio_path = abs_path
#                     print(f"   ✅ File found at absolute path")
#                 else:
#                     print(f"   ❌ File not found at absolute path either")
#                     print(f"{'='*60}\n")
#                     return self._error_response(f"Audio file not found: {original_audio_path}")
#             except Exception as e:
#                 print(f"   ❌ Error resolving path: {e}")
#                 print(f"{'='*60}\n")
#                 return self._error_response(f"Error accessing file: {original_audio_path}")
        
#         # Step 4: Validate Whisper model is loaded
#         if not self.model:
#             print(f"❌ Whisper model not loaded")
#             print(f"{'='*60}\n")
#             return self._error_response("Whisper model not loaded. Please ensure USE_LOCAL_WHISPER=true in .env")
        
#         try:
#             # Step 5: Verify file details
#             print(f"   File exists: {os.path.exists(audio_path)}")
#             file_size_kb = os.path.getsize(audio_path) / 1024
#             print(f"   File size: {file_size_kb:.2f} KB")
            
#             # Step 6: Start transcription
#             print(f"\n   Starting transcription...")
#             # BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
#             # full_audio_path = os.path.join(BASE_DIR, audio_path)

#             BASE_DIR = Path(__file__).resolve().parents[2]  # points to backend/
#             uploads_path = BASE_DIR / "uploads" / "audio_files"
#             file_name = Path(audio_path).name
#             full_audio_path = uploads_path / file_name




#             print("🎧 Trying to read:", full_audio_path)
#             print("🔍 Exists:", os.path.exists(full_audio_path))

#             if not os.path.exists(full_audio_path):
#                raise FileNotFoundError(f"Audio file not found at {full_audio_path}")
#             result = self.model.transcribe(
#                 audio_path,
#                 language="en",
#                 task="transcribe",
#                 verbose=False,
#                 fp16=False  # Disable FP16 for CPU compatibility
#             )
            
#             # Step 7: Parse segments from result
#             segments = []
#             for seg in result.get('segments', []):
#                 segments.append({
#                     'speaker': 'unknown',  # Will be classified later by diarization service
#                     'text': seg['text'].strip(),
#                     'start_time': float(seg['start']),
#                     'end_time': float(seg['end']),
#                     'confidence': 0.95  # Whisper doesn't provide per-segment confidence
#                 })
            
#             full_text = result['text'].strip()
            
#             # Step 8: Return success with transcription data
#             print(f"\n✅ TRANSCRIPTION SUCCESS")
#             print(f"   Segments: {len(segments)}")
#             print(f"   Total characters: {len(full_text)}")
#             print(f"   Language: {result.get('language', 'en')}")
#             print(f"   Preview: {full_text[:80]}...")
#             print(f"{'='*60}\n")
            
#             return {
#                 'segments': segments,
#                 'full_text': full_text,
#                 'source': 'whisper_local',
#                 'language': result.get('language', 'en'),
#                 'duration': result.get('duration', 0.0)
#             }
            
#         except Exception as e:
#             print(f"\n❌ TRANSCRIPTION ERROR")
#             print(f"   Error: {e}")
#             print(f"{'='*60}\n")
#             import traceback
#             traceback.print_exc()
#             return self._error_response(str(e))
    
#     def _error_response(self, error_msg: str) -> Dict:
#         """Return standardized error response"""
#         return {
#             'segments': [],
#             'full_text': '',
#             'source': 'error',
#             'error': error_msg
#         }
