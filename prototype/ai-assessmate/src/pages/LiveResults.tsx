
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, BookOpen, MessageSquare, Home, Loader2 } from "lucide-react";
import { getLiveInterviewResults } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const LiveResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState(null);
  
  // Get state from navigation
  const state = location.state || {};
  const { candidateName, candidateId, role, questionsCount } = state;

  useEffect(() => {
    const loadResults = async () => {
      try {
        if (sessionId) {
          console.log("🔄 Loading results for session:", sessionId);
          const response = await getLiveInterviewResults(sessionId);
          setEvaluation(response.data);
        } else {
          // Fallback to mock data if no session ID
          setEvaluation({
            overall_score: 75,
            grade: "B",
            success_probability: 78,
            avg_scores: { content: 75, communication: 72, confidence: 78 }
          });
        }
      } catch (error) {
        console.error("Failed to load results:", error);
        toast({
          title: "Error",
          description: "Failed to load interview results. Showing sample data.",
          variant: "destructive",
        });
        // Fallback to mock data
        setEvaluation({
          overall_score: 75,
          grade: "B",
          success_probability: 78,
          avg_scores: { content: 75, communication: 72, confidence: 78 }
        });
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [sessionId]);
  
  const getGradeColor = (grade: string) => {
    if (grade === "A+" || grade === "A") return "text-green-600";
    if (grade === "B" || grade === "B+") return "text-blue-600";
    if (grade === "C") return "text-yellow-600";
    return "text-red-600";
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#1A4D2E]" />
          <p className="mt-4 text-lg text-gray-600">Loading interview results...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-lg text-gray-600">No results available</p>
          <Button onClick={() => navigate("/candidates")} className="mt-4">
            Back to Candidates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
          <Award className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Completed!</h1>
        <p className="text-gray-600">
          {candidateName ? `${candidateName}'s Interview Results` : 'Interview Results'}
          {role && ` • ${role}`}
        </p>
      </div>
      
      <Card className="mb-6 border-2 border-[#1A4D2E]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Overall Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-6xl font-bold ${getGradeColor(evaluation.grade)}`}>
              {evaluation.grade}
            </div>
            <div className="text-2xl text-gray-700 mt-2">{evaluation.overall_score}/100</div>
            <Progress value={evaluation.overall_score} className="mt-4 h-3" />
            <p className="text-sm text-gray-500 mt-2">
              Success Probability: {evaluation.success_probability || Math.round(evaluation.overall_score + 5)}%
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4" />
              Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#1A4D2E]">{Math.round(evaluation.avg_scores?.content || 75)}</div>
              <Progress value={evaluation.avg_scores?.content || 75} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4" />
              Communication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#1A4D2E]">{Math.round(evaluation.avg_scores?.communication || 72)}</div>
              <Progress value={evaluation.avg_scores?.communication || 72} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#1A4D2E]">{Math.round(evaluation.avg_scores?.confidence || 78)}</div>
              <Progress value={evaluation.avg_scores?.confidence || 78} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex gap-4 justify-center">
        <Button onClick={() => navigate("/")} className="bg-[#1A4D2E] hover:bg-[#163E25]">
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        <Button onClick={() => navigate("/select-role")} variant="outline">
          Start New Interview
        </Button>
      </div>
    </div>
  );
};

export default LiveResults;

