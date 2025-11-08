// import { TrendingUp, AlertCircle, CheckCircle, Award, BarChart2, Mic } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";

// interface Assessment {
//   overall_score?: number;
//   grade?: string;
//   success_probability?: number;
//   avg_scores?: {
//     content?: number;
//     communication?: number;
//     confidence?: number;
//   };
//   component_scores?: {
//     content?: number;
//     communication?: number;
//     confidence?: number;
//     technical?: number;
//   };
//   technical_score?: number;
//   strengths?: string;
//   weaknesses?: string;
//   recommendation?: string;
//   details?: Array<{
//     explanation?: string;
//   }>;
//   emotion_result?: {
//     emoji?: string;
//     description?: string;
//   };
// }

// interface ResultsCardProps {
//   assessment: Assessment | null;
// }

// export default function ResultsCard({ assessment }: ResultsCardProps) {
//   if (!assessment) return null;

//   const getGradeColor = (grade?: string) => {
//     if (!grade) return "text-muted-foreground";
//     if (grade.startsWith("A")) return "text-success";
//     if (grade.startsWith("B")) return "text-info";
//     if (grade.startsWith("C")) return "text-warning";
//     return "text-destructive";
//   };

//   const getGradeBg = (grade?: string) => {
//     if (!grade) return "bg-muted";
//     if (grade.startsWith("A")) return "bg-success/10";
//     if (grade.startsWith("B")) return "bg-info/10";
//     if (grade.startsWith("C")) return "bg-warning/10";
//     return "bg-destructive/10";
//   };

//   const getGradeBorder = (grade?: string) => {
//     if (!grade) return "border-muted";
//     if (grade.startsWith("A")) return "border-success";
//     if (grade.startsWith("B")) return "border-info";
//     if (grade.startsWith("C")) return "border-warning";
//     return "border-destructive";
//   };

//   const componentScores = {
//     content: assessment?.avg_scores?.content || assessment?.component_scores?.content || 0,
//     communication: assessment?.avg_scores?.communication || assessment?.component_scores?.communication || 0,
//     confidence: assessment?.avg_scores?.confidence || assessment?.component_scores?.confidence || 0,
//     technical: assessment?.technical_score || assessment?.component_scores?.technical || 0,
//   };

//   const getScoreBadge = (score: number) => {
//     if (score >= 85) return "Excellent";
//     if (score >= 70) return "Good";
//     if (score >= 55) return "Fair";
//     return "Needs Improvement";
//   };

//   const getScoreBadgeVariant = (score: number) => {
//     if (score >= 85) return "bg-success text-success-foreground";
//     if (score >= 70) return "bg-info text-info-foreground";
//     if (score >= 55) return "bg-warning text-warning-foreground";
//     return "bg-destructive text-destructive-foreground";
//   };

//   const getProgressColor = (score: number) => {
//     if (score >= 85) return "[&>div]:bg-success";
//     if (score >= 70) return "[&>div]:bg-info";
//     if (score >= 55) return "[&>div]:bg-warning";
//     return "[&>div]:bg-destructive";
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header Section */}
//       <Card className="border-border shadow-xl">
//         <CardHeader className="pb-8">
//           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
//             <div>
//               <CardTitle className="flex items-center gap-3 text-3xl mb-2">
//                 <Award className="h-8 w-8 text-accent" />
//                 Assessment Results
//               </CardTitle>
//               <p className="text-muted-foreground">Comprehensive AI-powered interview evaluation</p>
//             </div>

//             <div className="flex flex-col items-center gap-4">
//               <div className={`relative w-32 h-32 rounded-full border-8 ${getGradeBorder(assessment.grade)} flex items-center justify-center ${getGradeBg(assessment.grade)}`}>
//                 <div className="text-center">
//                   <div className="text-4xl font-bold text-foreground">{assessment.overall_score?.toFixed(1)}</div>
//                   <div className="text-sm text-muted-foreground">/100</div>
//                 </div>
//               </div>

//               <div className={`px-4 py-2 rounded-full border-2 ${getGradeBorder(assessment.grade)} ${getGradeBg(assessment.grade)}`}>
//                 <p className={`font-bold text-lg ${getGradeColor(assessment.grade)}`}>
//                   Grade: {assessment.grade}
//                 </p>
//                 {assessment.success_probability !== undefined && (
//                   <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
//                     <TrendingUp className="h-3 w-3" />
//                     {assessment.success_probability.toFixed(1)}% Success
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//         </CardHeader>
//       </Card>

//       {/* Component Scores */}
//       <Card className="border-border shadow-md">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <BarChart2 className="h-5 w-5 text-primary" />
//             Component Scores
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {Object.entries(componentScores).map(([label, value]) => (
//             <div key={label} className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <span className="font-medium capitalize">{label}</span>
//                 <div className="flex items-center gap-2">
//                   <Badge className={`${getScoreBadgeVariant(value)} text-xs`}>
//                     {getScoreBadge(value)}
//                   </Badge>
//                   <span className="text-sm font-bold">{value.toFixed(1)}/100</span>
//                 </div>
//               </div>
//               <Progress value={value} className={`h-3 ${getProgressColor(value)}`} />
//             </div>
//           ))}
//         </CardContent>
//       </Card>

//       {/* Assessment Details */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Card className="border-success/50 shadow-md">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2 text-lg">
//               <CheckCircle className="h-5 w-5 text-success" />
//               Strengths
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="text-foreground">{assessment.strengths || "No data available"}</p>
//           </CardContent>
//         </Card>

//         <Card className="border-warning/50 shadow-md">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2 text-lg">
//               <AlertCircle className="h-5 w-5 text-warning" />
//               Areas for Improvement
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="text-foreground">{assessment.weaknesses || "No data available"}</p>
//           </CardContent>
//         </Card>

//         <Card className="border-info/50 shadow-md">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2 text-lg">
//               <TrendingUp className="h-5 w-5 text-info" />
//               Recommendation
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="text-foreground">{assessment.recommendation || "No data available"}</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* AI Explanation */}
//       {assessment.details && assessment.details[0]?.explanation && (
//         <Card className="border-accent/50 shadow-md">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <BarChart2 className="h-5 w-5 text-accent" />
//               AI Explanation
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <pre className="whitespace-pre-wrap text-sm text-foreground font-mono bg-muted p-4 rounded-lg">
//               {assessment.details[0].explanation}
//             </pre>
//           </CardContent>
//         </Card>
//       )}

//       {/* Voice Tone Analysis */}
//       {assessment.emotion_result && (
//         <Card className="border-primary/50 shadow-md">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Mic className="h-5 w-5 text-primary" />
//               Voice Tone Analysis
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="text-foreground">
//               <span className="text-2xl mr-2">{assessment.emotion_result.emoji || "🎤"}</span>
//               {assessment.emotion_result.description || "No tone analysis available."}
//             </p>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }
