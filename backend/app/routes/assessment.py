# from fastapi import APIRouter, HTTPException
# from app.database import get_db
# from app.services import (
#     TranscriptionService,
#     SpeakerDiarization,
#     QuestionAnswerPairing,
#     CorrectnessChecker,
#     NLPEvaluator,
#     ScoringService,
# )
# from app.services.explainability import ExplainabilityService
# from app.services.emotion_analysis import EmotionAnalysisService
# from typing import Optional
# import json
# import os
# import traceback

# # ✅ Router definition
# router = APIRouter(prefix="/assessment", tags=["Assessment"])

# # ✅ Initialize services once
# transcription_service = TranscriptionService()
# diarization_service = SpeakerDiarization()
# qa_service = QuestionAnswerPairing()
# correctness_checker = CorrectnessChecker()
# nlp_evaluator = NLPEvaluator()
# scoring_service = ScoringService()
# explain_service = ExplainabilityService()
# emotion_service = EmotionAnalysisService()


# # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# # ENDPOINT 1: TRANSCRIPTION ONLY
# # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# @router.post("/transcribe/{interview_id}")
# def transcribe_interview(interview_id: int):
#     """
#     Step 1: Transcribe audio file
    
#     - Can take 2-10 minutes for medium/large Whisper models
#     - User waits for this to complete
#     - Status changes: pending → transcribed
#     - Returns transcription metadata
#     """
#     try:
#         with get_db() as conn:
#             cursor = conn.cursor()

#             # Fetch interview
#             cursor.execute("SELECT audio_path, status, candidate_id FROM interviews WHERE id = ?", (interview_id,))
#             interview_row = cursor.fetchone()
#             if not interview_row:
#                 raise HTTPException(status_code=404, detail="Interview not found")

#             audio_path = interview_row["audio_path"]
#             current_status = interview_row["status"]

#             print(f"\n🎙️ Starting transcription for interview #{interview_id}")
#             print(f"📁 Audio path: {audio_path}")
#             print(f"📊 Current status: {current_status}")
            
#             # ⚠️ Check if already transcribed
#             if current_status in ["transcribed", "evaluated"]:
#                 print(f"⚠️ Interview already transcribed (status: {current_status})")
                
#                 # Return existing transcription data
#                 cursor.execute("SELECT COUNT(*) as count FROM transcriptions WHERE interview_id = ?", (interview_id,))
#                 seg_count = cursor.fetchone()["count"]
                
#                 cursor.execute("SELECT COUNT(*) as count FROM qa_pairs WHERE interview_id = ?", (interview_id,))
#                 qa_count = cursor.fetchone()["count"]
                
#                 return {
#                     "success": True,
#                     "interview_id": interview_id,
#                     "status": current_status,
#                     "already_transcribed": True,
#                     "transcription": {
#                         "segments": seg_count,
#                         "qa_pairs": qa_count,
#                         "message": "Interview was already transcribed. Use /evaluate endpoint to get assessment."
#                     }
#                 }
            
#             # TRANSCRIPTION PROCESS
#             print("🔄 Calling Whisper model...")
#             transcription = transcription_service.transcribe_audio(audio_path)
            
#             if "error" in transcription:
#                 raise HTTPException(status_code=500, detail=f"Transcription failed: {transcription['error']}")

#             segments = transcription.get("segments", [])
#             if not segments:
#                 raise HTTPException(status_code=400, detail="No speech detected in audio")

#             # Speaker diarization
#             print("👥 Performing speaker diarization...")
#             diarized = diarization_service.separate_speakers(segments)
            
#             # QA pairing
#             print("❓ Pairing questions and answers...")
#             qa_pairs = qa_service.pair_qa(diarized)
#             valid_pairs = [p for p in qa_pairs if p.get("pair_valid")]

#             # Save transcription segments
#             print("💾 Saving transcription to database...")
#             cursor.execute("DELETE FROM transcriptions WHERE interview_id = ?", (interview_id,))
#             for seg in diarized.get("all_segments", []):
#                 cursor.execute(
#                     """
#                     INSERT INTO transcriptions (interview_id, speaker, text, start_time, end_time, confidence)
#                     VALUES (?, ?, ?, ?, ?, ?)
#                     """,
#                     (interview_id, seg.get("speaker"), seg.get("text"), seg.get("start_time"),
#                      seg.get("end_time"), seg.get("confidence")),
#                 )

#             # Save QA pairs
#             cursor.execute("DELETE FROM qa_pairs WHERE interview_id = ?", (interview_id,))
#             for pair in valid_pairs:
#                 cursor.execute(
#                     """
#                     INSERT INTO qa_pairs (interview_id, question, answer, question_time, answer_time, pair_valid)
#                     VALUES (?, ?, ?, ?, ?, 1)
#                     """,
#                     (interview_id, pair.get("question"), pair.get("answer"), pair.get("question_time"),
#                      pair.get("answer_time")),
#                 )

#             # Update interview status → transcribed
#             cursor.execute(
#                 "UPDATE interviews SET status = ?, duration = ? WHERE id = ?",
#                 ("transcribed", transcription.get("duration", 0), interview_id),
#             )
#             conn.commit()

#             print(f"\n✅ Transcription completed successfully!")
#             print(f"   Total segments: {len(segments)}")
#             print(f"   Valid QA pairs: {len(valid_pairs)}")
#             print(f"   Duration: {transcription.get('duration', 0):.2f}s")
#             print(f"   ➡️ Ready for evaluation\n")

#             return {
#                 "success": True,
#                 "interview_id": interview_id,
#                 "status": "transcribed",
#                 "transcription": {
#                     "segments": len(segments),
#                     "qa_pairs": len(valid_pairs),
#                     "duration": transcription.get("duration", 0),
#                     "full_text": transcription.get("full_text", ""),
#                     "language": transcription.get("language", "en")
#                 },
#                 "next_step": f"Call POST /assessment/evaluate/{interview_id} to get evaluation"
#             }

#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error in transcribe_interview: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))


# # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# # ENDPOINT 2: EVALUATION ONLY (FIXED VERSION)
# # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# @router.post("/evaluate/{interview_id}")
# def evaluate_interview(interview_id: int, reference_answer: Optional[str] = None, job_role: Optional[str] = None):
#     """
#     Step 2: Evaluate transcribed interview
    
#     ✅ FIXED: Properly extracts and aggregates NLP scores
#     """
#     try:
#         with get_db() as conn:
#             cursor = conn.cursor()

#             # Fetch interview
#             cursor.execute("SELECT audio_path, status, candidate_id FROM interviews WHERE id = ?", (interview_id,))
#             interview_row = cursor.fetchone()
#             if not interview_row:
#                 raise HTTPException(status_code=404, detail="Interview not found")

#             status = interview_row["status"]
#             candidate_id = interview_row["candidate_id"]
#             audio_path = interview_row["audio_path"]

#             print(f"\n📊 Starting evaluation for interview #{interview_id}")
#             print(f"📊 Current status: {status}")

#             # Check status
#             if status == "pending":
#                 raise HTTPException(
#                     status_code=400,
#                     detail="Interview must be transcribed first. Call /assessment/transcribe/{interview_id} first."
#                 )
            
#             if status == "evaluated":
#                 print(f"⚠️ Interview already evaluated")
                
#                 # Return existing assessment
#                 cursor.execute(
#                     "SELECT * FROM assessments WHERE interview_id = ? ORDER BY created_at DESC LIMIT 1",
#                     (interview_id,)
#                 )
#                 assessment = cursor.fetchone()
                
#                 if assessment:
#                     return {
#                         "success": True,
#                         "interview_id": interview_id,
#                         "already_evaluated": True,
#                         "assessment": {
#                             "assessment_id": assessment["id"],
#                             "overall_score": assessment["overall_score"],
#                             "success_probability": assessment["success_probability"],
#                             "grade": assessment["grade"],
#                             "content_score": assessment["content_score"],
#                             "communication_score": assessment["communication_score"],
#                             "confidence_score": assessment["confidence_score"],
#                             "technical_score": assessment["technical_score"],
#                             "strengths": assessment["strengths"],
#                             "weaknesses": assessment["weaknesses"],
#                             "recommendation": assessment["recommendation"],
#                         }
#                     }

#             # Get job role if not provided
#             if not job_role:
#                 cursor.execute("SELECT position FROM candidates WHERE id = ?", (candidate_id,))
#                 c = cursor.fetchone()
#                 job_role = c["position"] if c else "General"

#             # Fetch QA pairs
#             cursor.execute(
#                 """
#                 SELECT id, question, answer FROM qa_pairs
#                 WHERE interview_id = ? AND pair_valid = 1
#                 ORDER BY question_time
#                 """,
#                 (interview_id,),
#             )
#             qa_rows = cursor.fetchall()
            
#             if not qa_rows:
#                 raise HTTPException(status_code=400, detail="No valid QA pairs found. Transcription may have failed.")

#             print(f"📝 Evaluating {len(qa_rows)} QA pairs...")

#             # ✅ FIX: Initialize score lists properly
#             all_scores = {
#                 "content": [],
#                 "communication": [],
#                 "confidence": []
#             }
#             detailed_list = []

#             # Evaluate each QA pair
#             for i, qa in enumerate(qa_rows, 1):
#                 q_text = qa["question"]
#                 a_text = qa["answer"]
                
#                 print(f"   [{i}/{len(qa_rows)}] Analyzing QA pair...")
                
#                 # Call NLP evaluator
#                 nlp_result = nlp_evaluator.evaluate_answer(q_text, a_text, reference_answer)
                
#                 # ✅ FIX: Extract scores with correct key names
#                 content_score = nlp_result.get('content_score', 0.0)
#                 communication_score = nlp_result.get('communication_score', 0.0)
#                 confidence_score = nlp_result.get('confidence_score', 0.0)
                
#                 print(f"       Scores: Content={content_score:.1f}, Comm={communication_score:.1f}, Conf={confidence_score:.1f}")
                
#                 # ✅ FIX: Append to lists
#                 all_scores["content"].append(float(content_score))
#                 all_scores["communication"].append(float(communication_score))
#                 all_scores["confidence"].append(float(confidence_score))
                
#                 # Generate explanation
#                 explanation_text = explain_service.generate_explanation(a_text, nlp_result)

#                 detailed_list.append({
#                     "qa_id": qa["id"],
#                     "question": q_text,
#                     "answer": a_text,
#                     "nlp": nlp_result,
#                     "explanation": explanation_text
#                 })

#                 # Log individual analysis
#                 try:
#                     cursor.execute(
#                         """INSERT INTO evaluation_logs (interview_id, analysis_type, analysis_data)
#                            VALUES (?, ?, ?)""",
#                         (interview_id, "NLP", json.dumps({"qa_id": qa["id"], "nlp": nlp_result})),
#                     )
#                     cursor.execute(
#                         """INSERT INTO evaluation_logs (interview_id, analysis_type, analysis_data)
#                            VALUES (?, ?, ?)""",
#                         (interview_id, "EXPLAINABILITY", json.dumps({"qa_id": qa["id"], "explanation": explanation_text})),
#                     )
#                 except Exception as e:
#                     print(f"⚠️ Logging error (ignored): {e}")

#             # ✅ FIX: Calculate averages properly
#             print(f"\n📊 DEBUG: Raw scores collected:")
#             print(f"   Content: {all_scores['content']}")
#             print(f"   Communication: {all_scores['communication']}")
#             print(f"   Confidence: {all_scores['confidence']}")
            
#             avg = {
#                 'content': (sum(all_scores['content']) / len(all_scores['content'])) if all_scores['content'] else 0,
#                 'communication': (sum(all_scores['communication']) / len(all_scores['communication'])) if all_scores['communication'] else 0,
#                 'confidence': (sum(all_scores['confidence']) / len(all_scores['confidence'])) if all_scores['confidence'] else 0
#             }
            
#             print(f"\n📊 Calculated averages:")
#             print(f"   Content: {avg['content']:.2f}")
#             print(f"   Communication: {avg['communication']:.2f}")
#             print(f"   Confidence: {avg['confidence']:.2f}")

#             # Technical correctness
#             print("🔍 Checking technical correctness...")
#             correctness = correctness_checker.check_correctness(
#                 " ".join([r["question"] for r in qa_rows]),
#                 " ".join([r["answer"] for r in qa_rows]),
#                 reference_answer,
#                 job_role,
#             )
#             technical_score = correctness.get("correctness_score", 0)

#             # Emotion analysis
#             print("😊 Analyzing emotions...")
#             try:
#                 if audio_path and os.path.exists(audio_path):
#                     emotion_result = emotion_service.analyze_emotion(audio_path)
#                 else:
#                     emotion_result = emotion_service.analyze_emotion("")
#             except Exception as e:
#                 print(f"⚠️ Emotion analysis failed: {e}")
#                 emotion_result = {
#                     "emotion": "unknown",
#                     "confidence_boost": avg.get("confidence", 50),
#                     "description": "Emotion analysis unavailable."
#                 }

#             # Merge confidence + emotion
#             avg["confidence"] = (avg.get("confidence", 0) + emotion_result.get("confidence_boost", 0)) / 2

#             # Overall scoring
#             print("🎯 Calculating overall score...")
#             scoring = scoring_service.calculate_overall_score(
#                 avg["content"], avg["communication"], avg["confidence"], technical_score
#             )

#             # Save assessment
#             cursor.execute(
#                 """
#                 INSERT INTO assessments (
#                     interview_id, content_score, communication_score, confidence_score,
#                     technical_score, overall_score, success_probability, grade,
#                     strengths, weaknesses, recommendation
#                 )
#                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
#                 """,
#                 (
#                     interview_id,
#                     avg["content"], avg["communication"], avg["confidence"],
#                     technical_score, scoring["overall_score"], scoring["success_probability"],
#                     scoring["grade"], scoring["strengths"], scoring["weaknesses"], scoring["recommendation"],
#                 ),
#             )
#             assessment_id = cursor.lastrowid

#             # Save summary log
#             try:
#                 cursor.execute(
#                     """INSERT INTO evaluation_logs (interview_id, analysis_type, analysis_data)
#                        VALUES (?, ?, ?)""",
#                     (interview_id, "SUMMARY", json.dumps({
#                         "assessment_id": assessment_id,
#                         "scoring": scoring,
#                         "avg_scores": avg,
#                         "technical_score": technical_score,
#                         "emotion": emotion_result
#                     })),
#                 )
#             except Exception as e:
#                 print(f"⚠️ Summary log write failed: {e}")

#             # Update status
#             cursor.execute("UPDATE interviews SET status = ? WHERE id = ?", ("evaluated", interview_id))
#             conn.commit()

#             print(f"\n✅ Evaluation completed successfully!")
#             print(f"   Assessment ID: {assessment_id}")
#             print(f"   Overall Score: {scoring['overall_score']:.2f}")
#             print(f"   Grade: {scoring['grade']}\n")

#             return {
#                 "success": True,
#                 "interview_id": interview_id,
#                 "assessment": {
#                     "assessment_id": assessment_id,
#                     **scoring,
#                     "avg_scores": avg,
#                     "technical_score": technical_score,
#                     "emotion_result": emotion_result,
#                     "details": detailed_list,
#                 },
#             }

#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"❌ Error in evaluate_interview: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))


from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.services import (
    TranscriptionService,
    SpeakerDiarization,
    QuestionAnswerPairing,
    CorrectnessChecker,
    NLPEvaluator,
    ScoringService,
)
from app.services.explainability import ExplainabilityService
from app.services.emotion_analysis import EmotionAnalysisService
from app.services.ai_recommendation import AIRecommendationGenerator  # ✅ NEW
from typing import Optional
import json
import os
import traceback


# ✅ Router definition
router = APIRouter(prefix="/assessment", tags=["Assessment"])


# ✅ Initialize services once
transcription_service = TranscriptionService()
diarization_service = SpeakerDiarization()
qa_service = QuestionAnswerPairing()
correctness_checker = CorrectnessChecker()
nlp_evaluator = NLPEvaluator()
scoring_service = ScoringService()
explain_service = ExplainabilityService()
emotion_service = EmotionAnalysisService()
ai_recommender = AIRecommendationGenerator()  # ✅ NEW



# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENDPOINT 1: TRANSCRIPTION ONLY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/transcribe/{interview_id}")
def transcribe_interview(interview_id: int):
    """
    Step 1: Transcribe audio file
    
    - Can take 2-10 minutes for medium/large Whisper models
    - User waits for this to complete
    - Status changes: pending → transcribed
    - Returns transcription metadata
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()


            # Fetch interview
            cursor.execute("SELECT audio_path, status, candidate_id FROM interviews WHERE id = ?", (interview_id,))
            interview_row = cursor.fetchone()
            if not interview_row:
                raise HTTPException(status_code=404, detail="Interview not found")


            audio_path = interview_row["audio_path"]
            current_status = interview_row["status"]


            print(f"\n🎙 Starting transcription for interview #{interview_id}")
            print(f"📁 Audio path: {audio_path}")
            print(f"📊 Current status: {current_status}")
            
            # ⚠ Check if already transcribed
            if current_status in ["transcribed", "evaluated"]:
                print(f"⚠ Interview already transcribed (status: {current_status})")
                
                # Return existing transcription data
                cursor.execute("SELECT COUNT(*) as count FROM transcriptions WHERE interview_id = ?", (interview_id,))
                seg_count = cursor.fetchone()["count"]
                
                cursor.execute("SELECT COUNT(*) as count FROM qa_pairs WHERE interview_id = ?", (interview_id,))
                qa_count = cursor.fetchone()["count"]
                
                return {
                    "success": True,
                    "interview_id": interview_id,
                    "status": current_status,
                    "already_transcribed": True,
                    "transcription": {
                        "segments": seg_count,
                        "qa_pairs": qa_count,
                        "message": "Interview was already transcribed. Use /evaluate endpoint to get assessment."
                    }
                }
            
            # TRANSCRIPTION PROCESS
            print("🔄 Calling Whisper model...")
            transcription = transcription_service.transcribe_audio(audio_path)
            
            if "error" in transcription:
                raise HTTPException(status_code=500, detail=f"Transcription failed: {transcription['error']}")


            segments = transcription.get("segments", [])
            if not segments:
                raise HTTPException(status_code=400, detail="No speech detected in audio")


            # Speaker diarization
            print("👥 Performing speaker diarization...")
            diarized = diarization_service.separate_speakers(segments)
            
            # QA pairing
            print("❓ Pairing questions and answers...")
            qa_pairs = qa_service.pair_qa(diarized)
            valid_pairs = [p for p in qa_pairs if p.get("pair_valid")]


            # Save transcription segments
            print("💾 Saving transcription to database...")
            cursor.execute("DELETE FROM transcriptions WHERE interview_id = ?", (interview_id,))
            for seg in diarized.get("all_segments", []):
                cursor.execute(
                    """
                    INSERT INTO transcriptions (interview_id, speaker, text, start_time, end_time, confidence)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (interview_id, seg.get("speaker"), seg.get("text"), seg.get("start_time"),
                     seg.get("end_time"), seg.get("confidence")),
                )


            # Save QA pairs
            cursor.execute("DELETE FROM qa_pairs WHERE interview_id = ?", (interview_id,))
            for pair in valid_pairs:
                cursor.execute(
                    """
                    INSERT INTO qa_pairs (interview_id, question, answer, question_time, answer_time, pair_valid)
                    VALUES (?, ?, ?, ?, ?, 1)
                    """,
                    (interview_id, pair.get("question"), pair.get("answer"), pair.get("question_time"),
                     pair.get("answer_time")),
                )


            # Update interview status → transcribed
            cursor.execute(
                "UPDATE interviews SET status = ?, duration = ? WHERE id = ?",
                ("transcribed", transcription.get("duration", 0), interview_id),
            )
            conn.commit()


            print(f"\n✅ Transcription completed successfully!")
            print(f"   Total segments: {len(segments)}")
            print(f"   Valid QA pairs: {len(valid_pairs)}")
            print(f"   Duration: {transcription.get('duration', 0):.2f}s")
            print(f"   ➡ Ready for evaluation\n")


            return {
                "success": True,
                "interview_id": interview_id,
                "status": "transcribed",
                "transcription": {
                    "segments": len(segments),
                    "qa_pairs": len(valid_pairs),
                    "duration": transcription.get("duration", 0),
                    "full_text": transcription.get("full_text", ""),
                    "language": transcription.get("language", "en")
                },
                "next_step": f"Call POST /assessment/evaluate/{interview_id} to get evaluation"
            }


    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in transcribe_interview: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ENDPOINT 2: EVALUATION ONLY (WITH AI RECOMMENDATIONS)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/evaluate/{interview_id}")
def evaluate_interview(interview_id: int, reference_answer: Optional[str] = None, job_role: Optional[str] = None):
    """
    Step 2: Evaluate transcribed interview
    
    ✅ FIXED: Properly extracts and aggregates NLP scores
    ✅ NEW: Generates AI-powered personalized recommendations
    """
    try:
        with get_db() as conn:
            cursor = conn.cursor()


            # Fetch interview
            cursor.execute("SELECT audio_path, status, candidate_id FROM interviews WHERE id = ?", (interview_id,))
            interview_row = cursor.fetchone()
            if not interview_row:
                raise HTTPException(status_code=404, detail="Interview not found")


            status = interview_row["status"]
            candidate_id = interview_row["candidate_id"]
            audio_path = interview_row["audio_path"]


            print(f"\n📊 Starting evaluation for interview #{interview_id}")
            print(f"📊 Current status: {status}")


            # Check status
            if status == "pending":
                raise HTTPException(
                    status_code=400,
                    detail="Interview must be transcribed first. Call /assessment/transcribe/{interview_id} first."
                )
            
            if status == "evaluated":
                print(f"⚠ Interview already evaluated")
                
                # Return existing assessment with AI recommendation
                cursor.execute(
                    "SELECT * FROM assessments WHERE interview_id = ? ORDER BY created_at DESC LIMIT 1",
                    (interview_id,)
                )
                assessment = cursor.fetchone()
                
                if assessment:
                    # Parse AI recommendation if exists
                    ai_rec = None
                    if assessment["ai_recommendation"]:
                        try:
                            ai_rec = json.loads(assessment["ai_recommendation"])
                        except:
                            pass
                    
                    return {
                        "success": True,
                        "interview_id": interview_id,
                        "already_evaluated": True,
                        "assessment": {
                            "assessment_id": assessment["id"],
                            "overall_score": assessment["overall_score"],
                            "success_probability": assessment["success_probability"],
                            "grade": assessment["grade"],
                            "avg_scores": {
                                "content": assessment["content_score"],
                                "communication": assessment["communication_score"],
                                "confidence": assessment["confidence_score"]
                            },
                            "technical_score": assessment["technical_score"],
                            "strengths": assessment["strengths"],
                            "weaknesses": assessment["weaknesses"],
                            "recommendation": assessment["recommendation"],
                            "ai_recommendation": ai_rec  # ✅ Return AI recommendations
                        }
                    }


            # Get candidate info
            cursor.execute("SELECT name, position FROM candidates WHERE id = ?", (candidate_id,))
            candidate_row = cursor.fetchone()
            candidate_name = candidate_row["name"] if candidate_row else "Candidate"
            
            # Get job role if not provided
            if not job_role:
                job_role = candidate_row["position"] if candidate_row else "General"


            # Fetch QA pairs
            cursor.execute(
                """
                SELECT id, question, answer FROM qa_pairs
                WHERE interview_id = ? AND pair_valid = 1
                ORDER BY question_time
                """,
                (interview_id,),
            )
            qa_rows = cursor.fetchall()
            
            if not qa_rows:
                raise HTTPException(status_code=400, detail="No valid QA pairs found. Transcription may have failed.")


            print(f"📝 Evaluating {len(qa_rows)} QA pairs...")


            # ✅ FIX: Initialize score lists properly
            all_scores = {
                "content": [],
                "communication": [],
                "confidence": []
            }
            detailed_list = []
            valid_pairs = []  # ✅ For AI recommendation


            # Evaluate each QA pair
            for i, qa in enumerate(qa_rows, 1):
                q_text = qa["question"]
                a_text = qa["answer"]
                
                print(f"   [{i}/{len(qa_rows)}] Analyzing QA pair...")
                
                # Call NLP evaluator
                nlp_result = nlp_evaluator.evaluate_answer(q_text, a_text, reference_answer)
                
                # ✅ FIX: Extract scores with correct key names
                content_score = nlp_result.get('content_score', 0.0)
                communication_score = nlp_result.get('communication_score', 0.0)
                confidence_score = nlp_result.get('confidence_score', 0.0)
                
                print(f"       Scores: Content={content_score:.1f}, Comm={communication_score:.1f}, Conf={confidence_score:.1f}")
                
                # ✅ FIX: Append to lists
                all_scores["content"].append(float(content_score))
                all_scores["communication"].append(float(communication_score))
                all_scores["confidence"].append(float(confidence_score))
                
                # ✅ Store for AI recommendation
                valid_pairs.append({
                    "question": q_text,
                    "answer": a_text
                })
                
                # Generate explanation
                explanation_text = explain_service.generate_explanation(a_text, nlp_result)


                detailed_list.append({
                    "qa_id": qa["id"],
                    "question": q_text,
                    "answer": a_text,
                    "nlp": nlp_result,
                    "explanation": explanation_text
                })


                # Log individual analysis
                try:
                    cursor.execute(
                        """INSERT INTO evaluation_logs (interview_id, analysis_type, analysis_data)
                           VALUES (?, ?, ?)""",
                        (interview_id, "NLP", json.dumps({"qa_id": qa["id"], "nlp": nlp_result})),
                    )
                    cursor.execute(
                        """INSERT INTO evaluation_logs (interview_id, analysis_type, analysis_data)
                           VALUES (?, ?, ?)""",
                        (interview_id, "EXPLAINABILITY", json.dumps({"qa_id": qa["id"], "explanation": explanation_text})),
                    )
                except Exception as e:
                    print(f"⚠ Logging error (ignored): {e}")


            # ✅ FIX: Calculate averages properly
            print(f"\n📊 DEBUG: Raw scores collected:")
            print(f"   Content: {all_scores['content']}")
            print(f"   Communication: {all_scores['communication']}")
            print(f"   Confidence: {all_scores['confidence']}")
            
            avg = {
                'content': (sum(all_scores['content']) / len(all_scores['content'])) if all_scores['content'] else 0,
                'communication': (sum(all_scores['communication']) / len(all_scores['communication'])) if all_scores['communication'] else 0,
                'confidence': (sum(all_scores['confidence']) / len(all_scores['confidence'])) if all_scores['confidence'] else 0
            }
            
            print(f"\n📊 Calculated averages:")
            print(f"   Content: {avg['content']:.2f}")
            print(f"   Communication: {avg['communication']:.2f}")
            print(f"   Confidence: {avg['confidence']:.2f}")


            # Technical correctness
            print("🔍 Checking technical correctness...")
            correctness = correctness_checker.check_correctness(
                " ".join([r["question"] for r in qa_rows]),
                " ".join([r["answer"] for r in qa_rows]),
                reference_answer,
                job_role,
            )
            technical_score = correctness.get("correctness_score", 0)


            # Emotion analysis
            print("😊 Analyzing emotions...")
            try:
                if audio_path and os.path.exists(audio_path):
                    emotion_result = emotion_service.analyze_emotion(audio_path)
                else:
                    emotion_result = emotion_service.analyze_emotion("")
            except Exception as e:
                print(f"⚠ Emotion analysis failed: {e}")
                emotion_result = {
                    "emotion": "unknown",
                    "confidence_boost": avg.get("confidence", 50),
                    "description": "Emotion analysis unavailable."
                }


            # Merge confidence + emotion
            avg["confidence"] = (avg.get("confidence", 0) + emotion_result.get("confidence_boost", 0)) / 2


            # Overall scoring
            print("🎯 Calculating overall score...")
            scoring = scoring_service.calculate_overall_score(
                avg["content"], avg["communication"], avg["confidence"], technical_score
            )


            # ✅ NEW: Generate AI-powered personalized recommendations
            print("🤖 Generating AI-powered personalized recommendations...")
            ai_recommendation = ai_recommender.generate_detailed_feedback(
                qa_pairs=valid_pairs,
                scores={
                    'content_score': avg['content'],
                    'communication_score': avg['communication'],
                    'confidence_score': avg['confidence'],
                    'technical_score': technical_score,
                    'overall_score': scoring['overall_score']
                },
                candidate_name=candidate_name,
                position=job_role
            )


            # ✅ Save assessment WITH AI recommendation
            cursor.execute(
                """
                INSERT INTO assessments (
                    interview_id, content_score, communication_score, confidence_score,
                    technical_score, overall_score, success_probability, grade,
                    strengths, weaknesses, recommendation, ai_recommendation
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    interview_id,
                    avg["content"], avg["communication"], avg["confidence"],
                    technical_score, scoring["overall_score"], scoring["success_probability"],
                    scoring["grade"], scoring["strengths"], scoring["weaknesses"], 
                    scoring["recommendation"],
                    json.dumps(ai_recommendation)  # ✅ Store AI recommendations
                ),
            )
            assessment_id = cursor.lastrowid


            # Save summary log
            try:
                cursor.execute(
                    """INSERT INTO evaluation_logs (interview_id, analysis_type, analysis_data)
                       VALUES (?, ?, ?)""",
                    (interview_id, "SUMMARY", json.dumps({
                        "assessment_id": assessment_id,
                        "scoring": scoring,
                        "avg_scores": avg,
                        "technical_score": technical_score,
                        "emotion": emotion_result,
                        "ai_recommendation": ai_recommendation
                    })),
                )
            except Exception as e:
                print(f"⚠ Summary log write failed: {e}")


            # Update status
            cursor.execute("UPDATE interviews SET status = ? WHERE id = ?", ("evaluated", interview_id))
            conn.commit()


            print(f"\n✅ Evaluation completed successfully!")
            print(f"   Assessment ID: {assessment_id}")
            print(f"   Overall Score: {scoring['overall_score']:.2f}")
            print(f"   Grade: {scoring['grade']}")
            print(f"   AI Recommendation: {ai_recommendation.get('decision', 'N/A')}\n")


            return {
                "success": True,
                "interview_id": interview_id,
                "assessment": {
                    "assessment_id": assessment_id,
                    **scoring,
                    "avg_scores": avg,
                    "technical_score": technical_score,
                    "emotion_result": emotion_result,
                    "details": detailed_list,
                    "ai_recommendation": ai_recommendation  # ✅ Return AI recommendations
                },
            }


    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in evaluate_interview: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))