import { motion } from "framer-motion"; // 🌀 Added Framer Motion
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Award,
  BarChart2,
  Mic,
} from "lucide-react";

export default function ResultCard({ assessment }) {
  if (!assessment) return null;

  const componentScores = {
    content:
      assessment?.avg_scores?.content ||
      assessment?.component_scores?.content ||
      assessment?.content_score ||
      0,
    communication:
      assessment?.avg_scores?.communication ||
      assessment?.component_scores?.communication ||
      assessment?.communication_score ||
      0,
    confidence:
      assessment?.avg_scores?.confidence ||
      assessment?.component_scores?.confidence ||
      assessment?.confidence_score ||
      0,
    technical:
      assessment?.technical_score ||
      assessment?.component_scores?.technical ||
      0,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Card className="border-border shadow-lg">
        {/* Header */}
        <CardHeader>
          <motion.div
            className="flex flex-col"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="flex items-center space-x-2 text-foreground text-2xl">
              <Award className="h-6 w-6 text-primary" />
              <span>Evaluation Summary</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              AI-powered performance evaluation and scoring
            </p>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* ✅ Overall Score */}
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
          >
            <motion.div
              className="w-32 h-32 rounded-full border-8 border-primary flex items-center justify-center text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 150 }}
            >
              <div>
                <motion.p
                  className="text-4xl font-bold text-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {assessment.overall_score?.toFixed(1) || 0}
                </motion.p>
                <p className="text-sm text-muted-foreground">Overall Score</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ✅ Component Scores */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {Object.entries(componentScores).map(([label, value]) => (
              <motion.div
                key={label}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="capitalize font-medium text-foreground">
                      {label}
                    </span>
                    <span className="font-semibold text-foreground">
                      {value.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ✅ Strengths / Weaknesses / Recommendation */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            {[
              {
                title: "Strengths",
                icon: <CheckCircle className="h-5 w-5" />,
                color: "text-success",
                border: "border-success",
                content: assessment.strengths || "No data available.",
              },
              {
                title: "Weaknesses",
                icon: <AlertCircle className="h-5 w-5" />,
                color: "text-warning",
                border: "border-warning",
                content: assessment.weaknesses || "No data available.",
              },
              {
                title: "Recommendation",
                icon: <TrendingUp className="h-5 w-5" />,
                color: "text-info",
                border: "border-info",
                content: assessment.recommendation || "No data available.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.03 }}
              >
                <Card className={`${item.border} shadow-sm`}>
                  <CardHeader>
                    <CardTitle
                      className={`flex items-center space-x-2 ${item.color}`}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground text-sm">{item.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* ✅ AI Explanation */}
          {assessment.details?.[0]?.explanation && (
            <motion.div
              className="mt-8 p-6 rounded-lg bg-muted/40 border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <BarChart2 className="h-5 w-5 text-accent" />
                <h4 className="font-semibold text-foreground text-lg">
                  AI Explanation
                </h4>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                {assessment.details[0].explanation}
              </pre>
            </motion.div>
          )}

          {/* ✅ Voice Tone Analysis */}
          {assessment.emotion_result && (
            <motion.div
              className="mt-8 p-6 rounded-lg bg-muted/40 border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Mic className="h-5 w-5 text-accent" />
                <h4 className="font-semibold text-foreground text-lg">
                  Voice Tone Analysis
                </h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {assessment.emotion_result.emoji || "🎤"}{" "}
                {assessment.emotion_result.description ||
                  "No tone analysis available."}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
