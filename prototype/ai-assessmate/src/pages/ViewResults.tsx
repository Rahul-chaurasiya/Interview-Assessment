import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { getInterviewDetails, evaluateInterview, transcribeInterview } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import TranscriptionSection from "@/components/TranscriptionSection";
import ResultCard from "@/components/ResultsCard";
import AIRecommendation from "@/components/AIRecommendation";

function normalizeRecommendation(raw) {
  if (!raw) return null;

  return {
    decision: raw.decision || "N/A",
    summary: raw.summary || "No summary provided",
    strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
    weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses : [],
    development_plan: Array.isArray(raw.development_plan) 
      ? raw.development_plan 
      : (Array.isArray(raw.action_plan) ? raw.action_plan : []),
    readiness: raw.readiness || "Unknown",
    next_steps: raw.next_steps || "No next steps provided",
    icon: raw.icon || "🤖",
    color: raw.color || "#3b82f6",
    ai_generated: raw.ai_generated ?? false,
  };
}

export default function ViewResults() {
  const { interviewId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!interviewId) {
      setError("No interview ID provided");
      setLoading(false);
      return;
    }

    const id = parseInt(interviewId);
    if (isNaN(id) || id <= 0) {
      setError("Invalid interview ID provided");
      setLoading(false);
      return;
    }

    loadInterview();
  }, [interviewId]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log(`🔍 Loading interview details for ID: ${interviewId}`);
      const response = await getInterviewDetails(interviewId);
      console.log(`📊 Interview data received:`, response.data);
      
      const status = response.data?.status;
      console.log(`📋 Interview status: ${status}`);
      
      if (status === "pending") {
        await transcribeAndEvaluate();
        return;
      }

      if (!response.data?.assessment) {
        await evaluateAndRefetch();
        return;
      }

      setData(response.data);
      
    } catch (err) {
      console.error("❌ Error loading interview:", err);
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          "Error fetching results.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to fetch interview results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const evaluateAndRefetch = async () => {
    try {
      setError("");
      
      await evaluateInterview(interviewId);
      
      const updated = await getInterviewDetails(interviewId);
      setData(updated.data);
      
    } catch (err) {
      console.error("❌ Error during evaluation:", err);
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          "Error during evaluation.";
      setError(errorMessage);
      toast({
        title: "Evaluation Error",
        description: "Failed to evaluate interview.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const transcribeAndEvaluate = async () => {
    try {
      toast({ 
        title: "Transcribing Interview", 
        description: "Converting audio to text. This may take a few minutes..." 
      });
      
      await transcribeInterview(interviewId);
      
      await evaluateAndRefetch();
      
    } catch (err) {
      console.error("❌ Transcription error:", err);
      setLoading(false);
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          "Unable to transcribe interview.";
      setError(errorMessage);
      toast({
        title: "Transcription Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading interview results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive text-lg">
          {typeof error === 'string' ? error : 'Error loading interview data'}
        </p>
        <Link to="/candidates">
          <Button className="mt-4">Back to Candidates</Button>
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No interview data found.</p>
        <Link to="/candidates">
          <Button className="mt-4">Back to Candidates</Button>
        </Link>
      </div>
    );
  }

  const { assessment } = data;
  
  const normalizedRecommendation = normalizeRecommendation(
    assessment?.ai_recommendation
  );

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <Link to="/candidates">
        <Button variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Candidates
        </Button>
      </Link>

      <Card className="shadow-lg border-border">
        <CardContent className="pt-6">
          <Tabs defaultValue="transcription">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
              <TabsTrigger value="recommendation">
                Recommendation
                {normalizedRecommendation?.ai_generated && (
                  <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500"></span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcription" className="mt-6">
              <TranscriptionSection transcription={data} loading={false} />
            </TabsContent>

            <TabsContent value="evaluation" className="mt-6">
              <ResultCard assessment={assessment} />
            </TabsContent>

            <TabsContent value="recommendation" className="mt-6">
              <AIRecommendation recommendation={normalizedRecommendation} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}