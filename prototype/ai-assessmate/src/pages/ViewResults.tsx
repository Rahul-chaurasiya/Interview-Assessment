import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { getInterviewDetails, evaluateInterview } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import TranscriptionSection from "@/components/TranscriptionSection";
import ResultCard from "@/components/ResultsCard";
import AIRecommendation from "@/components/AIRecommendation";

// ✅ Normalizer ensures future backend format changes don't break UI
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
    loadInterview();
  }, [interviewId]);

  // ✅ STEP 1: Load initial interview data
  const loadInterview = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("📥 Step 1: Fetching interview details for ID:", interviewId);
      
      const response = await getInterviewDetails(interviewId);
      
      console.log("✅ Step 2: Interview data received:", response.data);
      console.log("✅ Step 2: Assessment exists:", !!response.data?.assessment);

      // If assessment doesn't exist, evaluate it
      if (!response.data?.assessment) {
        console.log("⚠️ Step 3: No assessment found, starting evaluation...");
        await evaluateAndRefetch(); // ✅ Call evaluation function
        return; // ✅ EXIT HERE - evaluateAndRefetch handles setLoading(false)
      }

      // Assessment exists, use it
      setData(response.data);
      console.log("✅ Step 3: Using existing assessment");
      
    } catch (err) {
      console.error("❌ Error loading interview:", err);
      setError(err.response?.data?.detail || "Error fetching results.");
      toast({
        title: "Error",
        description: "Failed to fetch interview results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ STEP 2: Evaluate and refetch data (handles its own loading state)
  const evaluateAndRefetch = async () => {
    try {
      console.log("🤖 Step 4: Calling evaluateInterview API...");
      
      toast({ 
        title: "Evaluating Interview", 
        description: "AI is analyzing the interview..." 
      });
      
      // Call backend to generate AI recommendation
      await evaluateInterview(interviewId);
      
      console.log("✅ Step 5: Evaluation complete, now refetching fresh data...");
      
      // ✅ CRITICAL: Immediately refetch to get the new AI recommendation
      const updated = await getInterviewDetails(interviewId);
      
      console.log("✅ Step 6: Fresh data received:", updated.data);
      console.log("✅ Step 6: AI Recommendation data:", updated.data?.assessment?.ai_recommendation);
      
      // Update state with fresh data
      setData(updated.data);
      
      toast({
        title: "Evaluation Complete",
        description: "AI recommendations generated successfully.",
      });
      
    } catch (err) {
      console.error("❌ Evaluation error:", err);
      toast({
        title: "Evaluation Failed",
        description: "Unable to evaluate interview.",
        variant: "destructive",
      });
    } finally {
      // ✅ THIS is where loading stops - AFTER refetch completes
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading interview results...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive text-lg">{error}</p>
        <Link to="/candidates">
          <Button className="mt-4">Back to Candidates</Button>
        </Link>
      </div>
    );
  }

  // Render no data state
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
  
  // ✅ DEBUG LOGS - Check what data is being passed
  console.log("📊 DEBUG: Assessment:", assessment);
  console.log("📊 DEBUG: Raw AI Recommendation:", assessment?.ai_recommendation);
  
  const normalizedRecommendation = normalizeRecommendation(
    assessment?.ai_recommendation
  );
  
  console.log("📊 DEBUG: Normalized recommendation:", normalizedRecommendation);

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
                {/* ✅ Green dot if AI-generated */}
                {normalizedRecommendation?.ai_generated && (
                  <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500"></span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Transcription */}
            <TabsContent value="transcription" className="mt-6">
              <TranscriptionSection transcription={data} loading={false} />
            </TabsContent>

            {/* Tab 2: Evaluation */}
            <TabsContent value="evaluation" className="mt-6">
              <ResultCard assessment={assessment} />
            </TabsContent>

            {/* Tab 3: AI Recommendation */}
            <TabsContent value="recommendation" className="mt-6">
              <AIRecommendation recommendation={normalizedRecommendation} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}











/// ye working hai 


// import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { ArrowLeft } from "lucide-react";
// import { getInterviewDetails, evaluateInterview } from "@/services/api";
// import { toast } from "@/hooks/use-toast";
// import TranscriptionSection from "@/components/TranscriptionSection";
// import ResultCard from "@/components/ResultsCard";
// import AIRecommendation from "@/components/AIRecommendation";

// // ✅ Normalizer ensures future backend format changes don’t break UI
// function normalizeRecommendation(raw) {
//   if (!raw) return null;

//   return {
//     decision: raw.decision || "N/A",
//     summary: raw.summary || "No summary provided",
//     strengths: raw.strengths || [],
//     weaknesses: raw.weaknesses || [],
//     development_plan: raw.development_plan || raw.action_plan || [],
//     readiness: raw.readiness || "Unknown",
//     next_steps: raw.next_steps || "No next steps provided",
//     icon: raw.icon || "🤖",
//     color: raw.color || "#3b82f6",
//     ai_generated: raw.ai_generated ?? false,
//   };
// }

// export default function ViewResults() {
//   const { interviewId } = useParams();
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [evaluating, setEvaluating] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     fetchResults();
//   }, [interviewId]);

//   const fetchResults = async () => {
//     try {
//       setLoading(true);
//       const response = await getInterviewDetails(interviewId);
//       setData(response.data);
//       if (!response.data.assessment) await handleEvaluate();
//     } catch (err) {
//       setError(err.response?.data?.detail || "Error fetching results.");
//       toast({
//         title: "Error",
//         description: "Failed to fetch interview results.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEvaluate = async () => {
//     try {
//       setEvaluating(true);
//       toast({ title: "Evaluating Interview", description: "Please wait..." });
//       await evaluateInterview(interviewId);
//       const updated = await getInterviewDetails(interviewId);
//       setData(updated.data);
//       toast({ title: "Evaluation Complete", description: "AI evaluation done." });
//     } catch {
//       toast({
//         title: "Evaluation Failed",
//         description: "Unable to evaluate interview.",
//         variant: "destructive",
//       });
//     } finally {
//       setEvaluating(false);
//     }
//   };

//   if (loading || evaluating)
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[50vh]">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
//         <p className="text-muted-foreground">
//           {evaluating ? "Evaluating interview..." : "Loading results..."}
//         </p>
//       </div>
//     );

//   if (error)
//     return (
//       <div className="text-center py-12">
//         <p className="text-destructive text-lg">{error}</p>
//         <Link to="/candidates">
//           <Button className="mt-4">Back to Candidates</Button>
//         </Link>
//       </div>
//     );

//   const { assessment } = data;
//   const normalizedRecommendation = normalizeRecommendation(assessment?.ai_recommendation);

//   return (
//     <div className="max-w-6xl mx-auto py-8 space-y-6">
//       <Link to="/candidates">
//         <Button variant="outline">
//           <ArrowLeft className="h-4 w-4 mr-2" /> Back to Candidates
//         </Button>
//       </Link>

//       <Card className="shadow-lg border-border">
//         <CardContent className="pt-6">
//           <Tabs defaultValue="transcription">
//             <TabsList className="grid grid-cols-3 w-full">
//               <TabsTrigger value="transcription">Transcription</TabsTrigger>
//               <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
//               <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
//             </TabsList>

//             {/* Tab 1: Transcription */}
//             <TabsContent value="transcription" className="mt-6">
//               <TranscriptionSection transcription={data} loading={false} />
//             </TabsContent>

//             {/* Tab 2: Evaluation */}
//             <TabsContent value="evaluation" className="mt-6">
//               <ResultCard assessment={assessment} />
//             </TabsContent>

//             {/* Tab 3: AI Recommendation */}
//             <TabsContent value="recommendation" className="mt-6">
//               <AIRecommendation recommendation={normalizedRecommendation} />
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }






// import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { ArrowLeft } from "lucide-react";
// import { getInterviewDetails, evaluateInterview } from "@/services/api";
// import { toast } from "@/hooks/use-toast";
// import TranscriptionSection from "@/components/TranscriptionSection";
// import ResultCard from "@/components/ResultsCard";
// import { AlertCircle, CheckCircle } from "lucide-react";

// export default function ViewResults() {
//   const { interviewId } = useParams();
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [evaluating, setEvaluating] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     fetchResults();
//   }, [interviewId]);

//   const fetchResults = async () => {
//     try {
//       setLoading(true);
//       const response = await getInterviewDetails(interviewId);
//       setData(response.data);
//       if (!response.data.assessment) await handleEvaluate();
//     } catch (err) {
//       setError(err.response?.data?.detail || "Error fetching results.");
//       toast({
//         title: "Error",
//         description: "Failed to fetch interview results.",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEvaluate = async () => {
//     try {
//       setEvaluating(true);
//       toast({ title: "Evaluating Interview", description: "Please wait..." });
//       await evaluateInterview(interviewId);
//       const updated = await getInterviewDetails(interviewId);
//       setData(updated.data);
//       toast({ title: "Evaluation Complete", description: "AI evaluation done." });
//     } catch {
//       toast({
//         title: "Evaluation Failed",
//         description: "Unable to evaluate interview.",
//         variant: "destructive",
//       });
//     } finally {
//       setEvaluating(false);
//     }
//   };

//   if (loading || evaluating)
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[50vh]">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
//         <p className="text-muted-foreground">
//           {evaluating ? "Evaluating interview..." : "Loading results..."}
//         </p>
//       </div>
//     );

//   if (error)
//     return (
//       <div className="text-center py-12">
//         <p className="text-destructive text-lg">{error}</p>
//         <Link to="/candidates">
//           <Button className="mt-4">Back to Candidates</Button>
//         </Link>
//       </div>
//     );

//   const { assessment } = data;

//   return (
//     <div className="max-w-6xl mx-auto py-8 space-y-6">
//       <Link to="/candidates">
//         <Button variant="outline">
//           <ArrowLeft className="h-4 w-4 mr-2" /> Back to Candidates
//         </Button>
//       </Link>

//       <Card className="shadow-lg border-border">
//         <CardContent className="pt-6">
//           <Tabs defaultValue="transcription">
//             <TabsList className="grid grid-cols-3 w-full">
//               <TabsTrigger value="transcription">Transcription</TabsTrigger>
//               <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
//               <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
//             </TabsList>

//             <TabsContent value="transcription" className="mt-6">
//               <TranscriptionSection transcription={data} loading={false} />
//             </TabsContent>

//             <TabsContent value="evaluation" className="mt-6">
//               <ResultCard assessment={assessment} />
//             </TabsContent>

// <TabsContent value="recommendation" className="mt-6">
//   {assessment?.ai_recommendation ? (
//     <Card className="border-border shadow-lg">
//       <CardContent className="p-6 space-y-8">
//         {/* HEADER */}
//         <div className="flex items-center justify-between">
//           <h2 className="text-2xl font-semibold text-foreground flex items-center space-x-2">
//             <span>{assessment.ai_recommendation.icon || "🤖"}</span>
//             <span>AI Recommendation</span>
//           </h2>
//           {assessment.ai_recommendation.ai_generated && (
//             <span className="text-xs font-medium text-muted-foreground">
//               AI Generated
//             </span>
//           )}
//         </div>

//         {/* Decision Banner */}
//         <div
//           className={`p-5 rounded-lg border-2`}
//           style={{
//             borderColor: assessment.ai_recommendation.color || "#ccc",
//             backgroundColor: `${assessment.ai_recommendation.color}15`,
//           }}
//         >
//           <h3 className="text-xl font-semibold text-foreground mb-2">
//             Decision: {assessment.ai_recommendation.decision}
//           </h3>
//           <p className="text-muted-foreground text-sm leading-relaxed">
//             {assessment.ai_recommendation.summary ||
//               "No summary provided by AI."}
//           </p>
//         </div>

//         {/* Strengths and Weaknesses */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <Card className="border-success">
//             <CardContent className="p-4">
//               <h4 className="font-semibold text-success mb-2 flex items-center space-x-2">
//                 <CheckCircle className="h-5 w-5" />
//                 <span>Strengths</span>
//               </h4>
//               <ul className="space-y-1 text-sm text-foreground">
//                 {assessment.ai_recommendation.strengths?.length ? (
//                   assessment.ai_recommendation.strengths.map((s, i) => (
//                     <li key={i}>• {s}</li>
//                   ))
//                 ) : (
//                   <li>No strengths identified.</li>
//                 )}
//               </ul>
//             </CardContent>
//           </Card>

//           <Card className="border-warning">
//             <CardContent className="p-4">
//               <h4 className="font-semibold text-warning mb-2 flex items-center space-x-2">
//                 <AlertCircle className="h-5 w-5" />
//                 <span>Weaknesses</span>
//               </h4>
//               <ul className="space-y-1 text-sm text-foreground">
//                 {assessment.ai_recommendation.weaknesses?.length ? (
//                   assessment.ai_recommendation.weaknesses.map((w, i) => (
//                     <li key={i}>• {w}</li>
//                   ))
//                 ) : (
//                   <li>No weaknesses found.</li>
//                 )}
//               </ul>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Development Plan */}
//         {assessment.ai_recommendation.development_plan?.length > 0 && (
//           <div className="space-y-4">
//             <h4 className="font-semibold text-foreground text-xl">
//               Development Plan
//             </h4>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {assessment.ai_recommendation.development_plan.map((plan, idx) => (
//                 <Card key={idx} className="border-border">
//                   <CardContent className="p-4 space-y-2">
//                     <p className="font-semibold text-primary">
//                       Area: {plan.area}
//                     </p>
//                     <p className="text-foreground text-sm">
//                       Action: {plan.action}
//                     </p>
//                     <p className="text-sm text-muted-foreground">
//                       Resources:
//                     </p>
//                     <ul className="list-disc list-inside text-sm text-muted-foreground">
//                       {plan.resources?.map((r, i) => (
//                         <li key={i}>{r}</li>
//                       ))}
//                     </ul>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Readiness & Next Steps */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
//           <div className="flex items-start space-x-3">
//             <span className="text-primary text-lg"></span>
//             <div>
//               <p className="font-semibold text-foreground">Readiness</p>
//               <p className="text-muted-foreground text-sm">
//                 {assessment.ai_recommendation.readiness || "Not specified"}
//               </p>
//             </div>
//           </div>
//           <div className="flex items-start space-x-3">
//             <span className="text-primary text-lg"></span>
//             <div>
//               <p className="font-semibold text-foreground">Next Steps</p>
//               <p className="text-muted-foreground text-sm">
//                 {assessment.ai_recommendation.next_steps ||
//                   "No next steps defined."}
//               </p>
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   ) : (
//     <div className="text-center py-12">
//       <p className="text-muted-foreground text-lg">
//         No AI recommendation data found
//       </p>
//     </div>
//   )}
// </TabsContent>


//             {/* <TabsContent value="recommendation" className="mt-6">
//               <Card className="border-accent shadow-md">
//                 <CardContent className="p-6">
//                   <h2 className="text-2xl font-semibold text-foreground mb-2">
//                     AI Recommendation
//                   </h2>
//                   <p className="text-muted-foreground mb-4">
//                     {assessment.recommendation || "No recommendation available."}
//                   </p>
//                   <h3 className="text-lg font-semibold text-success">
//                     Strengths
//                   </h3>
//                   <p className="text-foreground mb-4">
//                     {assessment.strengths || "No data."}
//                   </p>
//                   <h3 className="text-lg font-semibold text-warning">
//                     Weaknesses
//                   </h3>
//                   <p className="text-foreground">
//                     {assessment.weaknesses || "No data."}
//                   </p>
//                 </CardContent>
//               </Card>
//             </TabsContent> */}
//           </Tabs>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }







// import { useEffect, useState } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Progress } from '@/components/ui/progress';
// import TranscriptionSection from "@/components/TranscriptionSection";
// import ResultCard from "@/components/ResultCard";
// import {
//   User, Mail, Briefcase, TrendingUp, MessageSquare,
//   Sparkles, CheckCircle, AlertCircle, BookOpen, ArrowLeft,
//   Target, Clock, Award
// } from 'lucide-react';
// import { getInterviewDetails, evaluateInterview } from '@/services/api';
// import { toast } from '@/hooks/use-toast';

// const ViewResults = () => {
//   const { interviewId } = useParams(); // ✅ use interviewId
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [evaluating, setEvaluating] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchResults();
//   }, [interviewId]);

//   const fetchResults = async () => {
//     try {
//       setLoading(true);
//       const response = await getInterviewDetails(interviewId);
//       setData(response.data);

//       // ✅ Auto evaluate if no assessment
//       if (!response.data.assessment) {
//         await handleEvaluate();
//       }
//     } catch (err) {
//       console.error('Error fetching results:', err);
//       setError(err.response?.data?.detail || 'Error fetching interview results.');
//       toast({
//         title: 'Error Fetching Results',
//         description: err.response?.data?.detail || 'Failed to load interview results.',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEvaluate = async () => {
//     try {
//       setEvaluating(true);
//       toast({
//         title: 'Evaluating Interview',
//         description: 'Please wait while AI evaluates the interview...',
//       });

//       await evaluateInterview(interviewId);
//       const updated = await getInterviewDetails(interviewId);
//       setData(updated.data);

//       toast({
//         title: 'Evaluation Complete',
//         description: 'AI evaluation finished successfully.',
//       });
//     } catch (err) {
//       console.error('Error evaluating interview:', err);
//       setError(err.response?.data?.detail || 'Error evaluating interview.');
//       toast({
//         title: 'Evaluation Failed',
//         description: err.response?.data?.detail || 'Unable to evaluate interview.',
//         variant: 'destructive',
//       });
//     } finally {
//       setEvaluating(false);
//     }
//   };

//   // ================= Loading & Error =================
//   if (loading || evaluating) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[50vh]">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
//         <p className="text-muted-foreground">
//           {evaluating ? 'Evaluating interview...' : 'Loading results...'}
//         </p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center py-12">
//         <p className="text-destructive text-lg">{error}</p>
//         <Link to="/candidates">
//           <Button className="mt-4">Back to Candidates</Button>
//         </Link>
//       </div>
//     );
//   }

//   if (!data || !data.assessment) {
//     return (
//       <div className="text-center py-12">
//         <p className="text-muted-foreground text-lg">No assessment results found</p>
//         <Button className="mt-4" onClick={handleEvaluate}>Run Evaluation</Button>
//       </div>
//     );
//   }

//   // ================= Main UI =================
//   const { assessment, candidate } = data;
//   const aiRec = assessment.ai_recommendation;

//   const getGrade = (score) => {
//     if (score >= 85) return { grade: 'A', color: 'bg-success text-success-foreground' };
//     if (score >= 70) return { grade: 'B', color: 'bg-info text-info-foreground' };
//     if (score >= 55) return { grade: 'C', color: 'bg-warning text-warning-foreground' };
//     return { grade: 'D', color: 'bg-destructive text-destructive-foreground' };
//   };

//   const gradeData = getGrade(assessment.overall_score);

//   return (
//     <div className="space-y-8 max-w-6xl mx-auto">
//       <Link to="/candidates">
//         <Button variant="outline" className="mb-4">
//           <ArrowLeft className="h-4 w-4 mr-2" />
//           Back to Candidates
//         </Button>
//       </Link>

//       {/* Candidate Header */}
//       <Card className="border-border shadow-lg">
//         <CardContent className="pt-6">
//           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
//             <div className="flex-1 space-y-2">
//               <div className="flex items-center space-x-3">
//                 <User className="h-6 w-6 text-primary" />
//                 <h1 className="text-3xl font-bold text-foreground">
//                   {candidate?.name || 'Candidate'}
//                 </h1>
//               </div>
//               <div className="flex items-center space-x-2 text-muted-foreground">
//                 <Briefcase className="h-4 w-4" />
//                 <span>{candidate?.position || 'N/A'}</span>
//               </div>
//               <div className="flex items-center space-x-2 text-muted-foreground">
//                 <Mail className="h-4 w-4" />
//                 <span>{candidate?.email || 'N/A'}</span>
//               </div>
//             </div>

//             <div className="flex flex-col items-center space-y-4">
//               <div className="relative">
//                 <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
//                   <div className="text-center">
//                     <div className="text-4xl font-bold text-foreground">
//                       {assessment.overall_score}%
//                     </div>
//                     <div
//                       className={`inline-block px-4 py-1 rounded-full font-bold text-xl mt-2 ${gradeData.color}`}
//                     >
//                       {gradeData.grade}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               {aiRec?.success_probability !== undefined && (
//                 <div className="text-center">
//                   <p className="text-sm text-muted-foreground">Success Probability</p>
//                   <p className="text-2xl font-bold text-accent">
//                     {aiRec.success_probability}%
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Component Scores */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Card className="border-border shadow-md">
//           <CardHeader>
//             <CardTitle className="flex items-center space-x-2 text-foreground">
//               <BookOpen className="h-5 w-5 text-info" />
//               <span>Content Score</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-2">
//               <div className="flex justify-between items-center">
//                 <span className="text-3xl font-bold text-foreground">
//                   {assessment.content_score}%
//                 </span>
//               </div>
//               <Progress value={assessment.content_score} className="h-3" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-border shadow-md">
//           <CardHeader>
//             <CardTitle className="flex items-center space-x-2 text-foreground">
//               <MessageSquare className="h-5 w-5 text-success" />
//               <span>Communication</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-2">
//               <div className="flex justify-between items-center">
//                 <span className="text-3xl font-bold text-foreground">
//                   {assessment.communication_score}%
//                 </span>
//               </div>
//               <Progress value={assessment.communication_score} className="h-3" />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-border shadow-md">
//           <CardHeader>
//             <CardTitle className="flex items-center space-x-2 text-foreground">
//               <Award className="h-5 w-5 text-warning" />
//               <span>Confidence</span>
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-2">
//               <div className="flex justify-between items-center">
//                 <span className="text-3xl font-bold text-foreground">
//                   {assessment.confidence_score}%
//                 </span>
//               </div>
//               <Progress value={assessment.confidence_score} className="h-3" />
//             </div>
//           </CardContent>
//         </Card>
//       </div>




// <div className="space-y-8 max-w-6xl mx-auto">
 
//   <TranscriptionSection transcription={data} loading={false} />
//   <ResultCard assessment={assessment} />

// </div>


//       {/* AI Recommendation Section */}
//       {aiRec && (
//         <Card className="border-accent shadow-xl">
//           <CardHeader className="bg-accent/10">
//             <div className="flex items-center justify-between">
//               <CardTitle className="flex items-center space-x-2 text-foreground text-2xl">
//                 <Sparkles className="h-6 w-6 text-accent" />
//                 <span>AI-Powered Recommendation</span>
//               </CardTitle>
//               <Badge className="bg-accent text-accent-foreground">AI Generated</Badge>
//             </div>
//           </CardHeader>
//           <CardContent className="space-y-8 pt-6">
//             <div
//               className={`p-6 rounded-lg ${
//                 aiRec.recommendation === 'HIRE'
//                   ? 'bg-success/10 border-2 border-success'
//                   : aiRec.recommendation === 'CONSIDER'
//                   ? 'bg-warning/10 border-2 border-warning'
//                   : 'bg-destructive/10 border-2 border-destructive'
//               }`}
//             >
//               <div className="flex items-center space-x-3 mb-3">
//                 <Target className="h-6 w-6" />
//                 <span className="text-xl font-bold text-foreground">
//                   Decision: {aiRec.recommendation}
//                 </span>
//               </div>
//               <p className="text-foreground">{aiRec.decision_summary}</p>
//             </div>

//             {/* Strengths / Weakness / Dev Plan */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <Card className="border-success shadow-md">
//                 <CardHeader>
//                   <CardTitle className="flex items-center space-x-2 text-foreground">
//                     <CheckCircle className="h-5 w-5 text-success" />
//                     <span>Strengths</span>
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ul className="space-y-2">
//                     {aiRec.strengths?.map((item, idx) => (
//                       <li key={idx} className="flex items-start space-x-2">
//                         <span className="text-success mt-1">•</span>
//                         <span className="text-foreground">{item}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </CardContent>
//               </Card>

//               <Card className="border-warning shadow-md">
//                 <CardHeader>
//                   <CardTitle className="flex items-center space-x-2 text-foreground">
//                     <AlertCircle className="h-5 w-5 text-warning" />
//                     <span>Weaknesses</span>
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ul className="space-y-2">
//                     {aiRec.weaknesses?.map((item, idx) => (
//                       <li key={idx} className="flex items-start space-x-2">
//                         <span className="text-warning mt-1">•</span>
//                         <span className="text-foreground">{item}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </CardContent>
//               </Card>

//               <Card className="border-info shadow-md">
//                 <CardHeader>
//                   <CardTitle className="flex items-center space-x-2 text-foreground">
//                     <TrendingUp className="h-5 w-5 text-info" />
//                     <span>Development Plan</span>
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <p className="text-foreground">
//                     {aiRec.development_plan?.focus_areas?.join(', ') || 'N/A'}
//                   </p>
//                   <div className="flex flex-wrap gap-2">
//                     {aiRec.development_plan?.resources?.map((r, i) => (
//                       <Badge key={i} variant="outline" className="border-info text-info">
//                         {r}
//                       </Badge>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };

// export default ViewResults;




