import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  Square, 
  SkipForward, 
  CheckCircle, 
  Loader2,
  Clock,
  MessageCircle,
  Play
} from "lucide-react";
import { 
  startLiveInterview, 
  saveQuestionResponse, 
  getNextQuestion, 
  completeLiveInterview,
  getLiveInterviewResults,
  generateFollowUp
} from "@/services/api";
import { toast } from "@/hooks/use-toast";

const LiveInterviewV2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get questions from navigation state
  const initialState = location.state || {};
  const { role, questions: initialQuestions, questionCount, difficulty, candidateId, candidateName, candidateEmail } = initialState;
  
  console.log("🎯 LiveInterviewV2 Initialized:");
  console.log("   📋 Role:", role);
  console.log("   👤 Candidate ID:", candidateId);
  console.log("   👤 Candidate Name:", candidateName);
  console.log("   📝 Questions Count:", initialQuestions?.length);
  
  // State
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Debug: Log current state
  useEffect(() => {
    console.log("🔄 Interview State Update:");
    console.log("   📝 Total Questions:", questions.length);
    console.log("   📍 Current Index:", currentIndex);
    console.log("   ❓ Current Question:", currentQuestion);
    console.log("   🎤 Recording:", isRecording);
  }, [questions, currentIndex, currentQuestion, isRecording]);
  
  // Initialize interview
  useEffect(() => {
    // Reset audio chunks for new interview
    audioChunksRef.current = [];
    
    if (!initialQuestions || initialQuestions.length === 0) {
      toast({
        title: "Error",
        description: "No questions provided. Please generate questions first.",
        variant: "destructive",
      });
      navigate("/select-role");
      return;
    }
    
    setQuestions(initialQuestions);
    setCurrentQuestion(initialQuestions[0]);
    startInterviewSession();
  }, [initialQuestions, navigate]);

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Start interview session
  const startInterviewSession = async () => {
    try {
      setLoading(true);
      const response = await startLiveInterview({
        candidate_id: candidateId,
        role: role,
        questions: initialQuestions
      });
      
      setSessionId(response.data.session_id);
      setCurrentQuestion(initialQuestions[0]);
    } catch (error) {
      console.error("Failed to start interview:", error);
      toast({
        title: "Error",
        description: "Failed to start interview session.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Start recording answer
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop recording and save response
  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
    
    // Create audio blob
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    await saveResponse(audioBlob);
  };

  // Save response
  const saveResponse = async (audioBlob) => {
    try {
      setLoading(true);
      const response = await saveQuestionResponse(sessionId, {
        question_id: currentQuestion?.id || currentIndex + 1,
        question: currentQuestion?.question || questions[currentIndex]?.question,
        audio_data: audioBlob
      });
      
      setEvaluation(response.data.evaluation);
      setShowFeedback(true);
      
      toast({
        title: "Response Saved",
        description: `Score: ${response.data.evaluation?.content_score || 'N/A'}`,
      });
    } catch (error) {
      console.error("Failed to save response:", error);
      setShowFeedback(true);
    } finally {
      setLoading(false);
    }
  };

  // Next question
  const handleNextQuestion = async () => {
    setShowFeedback(false);
    setEvaluation(null);

    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
    } else {
      await finishInterview();
    }
  };

  // Generate follow-up question
  const handleFollowUp = async () => {
    setFollowUpLoading(true);
    try {
      const response = await generateFollowUp(
        sessionId || 1,
        currentQuestion?.id || currentIndex + 1
      );

      if (response.data.followup_question) {
        setCurrentQuestion(response.data.followup_question);
        toast({
          title: "Follow-up Question",
          description: "A follow-up question has been generated based on your answer.",
        });
      }
    } catch (error) {
      console.error("Failed to generate follow-up:", error);
      toast({
        title: "Error",
        description: "Could not generate follow-up question.",
        variant: "destructive",
      });
    } finally {
      setFollowUpLoading(false);
    }
  };

  // Finish interview - Navigate to results page
  const finishInterview = async () => {
    setLoading(true);
    try {
      // Stop any ongoing recording
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }

      // Complete the interview session
      if (sessionId) {
        try {
          await completeLiveInterview(sessionId);
        } catch (error) {
          console.log("Session completion error (non-critical):", error);
        }
      }

      toast({
        title: "Interview Completed",
        description: "Live interview completed successfully! Redirecting to results...",
      });

      // Navigate to results page
      setTimeout(() => {
        navigate(`/live-results/${sessionId}`, {
          state: { 
            interviewCompleted: true,
            candidateName: candidateName,
            candidateId: candidateId,
            role: role,
            questionsCount: questions.length
          }
        });
      }, 1500);

    } catch (error) {
      console.error("Failed to complete interview:", error);
      toast({
        title: "Interview Completion Failed",
        description: "Failed to complete the interview. Redirecting to candidates...",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate("/candidates");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (loading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#1A4D2E]" />
          <p className="mt-4 text-lg text-gray-600">Preparing your interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Live Interview</h1>
                <p className="text-gray-600">Role: {role}</p>
                <p className="text-sm text-gray-500">Candidate: {candidateName}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Question</div>
                <div className="text-2xl font-bold text-[#1A4D2E]">
                  {currentIndex + 1} / {questions.length}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Question {currentIndex + 1} of {questions.length}
              </CardTitle>
              <span className="text-sm text-gray-500">
                {currentQuestion.category || 'General'} • {currentQuestion.difficulty || 'Medium'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <MessageCircle className="h-6 w-6 text-[#1A4D2E] mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
                  {currentQuestion.question_text || currentQuestion.question || `Question ${currentIndex + 1}`}
                </h3>
                {currentQuestion.topic && (
                  <p className="text-sm text-gray-500 mt-2">
                    Topic: {currentQuestion.topic}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recording Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            {isRecording ? (
              <>
                <div className="relative">
                  <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  size="lg"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <Mic className="h-12 w-12 text-gray-400" />
                </div>
                <Button
                  onClick={startRecording}
                  className="bg-[#1A4D2E] hover:bg-[#2A5D3E] text-white"
                  size="lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons - Always visible after recording */}
      {!isRecording && currentQuestion && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Question {currentIndex + 1} of {questions.length}
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleNextQuestion}
                  className="bg-[#1A4D2E] hover:bg-[#2A5D3E] text-white"
                  disabled={loading}
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
                  <SkipForward className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  onClick={handleFollowUp}
                  variant="outline"
                  disabled={followUpLoading}
                >
                  {followUpLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  )}
                  Follow-up Question
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {showFeedback && evaluation && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Response</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {evaluation.content_score || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Content</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {evaluation.communication_score || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Communication</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {evaluation.confidence_score || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Interview Progress</span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentIndex + 1) / questions.length) * 100)}%
            </span>
          </div>
          <Progress 
            value={((currentIndex + 1) / questions.length) * 100} 
            className="h-2"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveInterviewV2;
