import { motion, AnimatePresence } from "framer-motion"; // 🌀 Added Framer Motion
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Volume2, User } from "lucide-react";

export default function TranscriptionSection({ transcription, loading }) {
  if (loading) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center p-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
          className="rounded-full h-10 w-10 border-b-2 border-primary mb-3"
        />
        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Loading transcription...
        </motion.p>
      </motion.div>
    );
  }

  if (!transcription) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const summary = transcription.transcription_summary || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Card className="border-border shadow-md">
        <CardHeader>
          <motion.div
            className="flex flex-col"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="flex items-center space-x-2 text-foreground text-2xl">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span>Transcription Analysis</span>
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Complete conversation breakdown between interviewer and candidate
            </p>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* ✅ Summary Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1 },
              },
            }}
          >
            {[
              { label: "Total Segments", value: summary.total_segments || 0 },
              { label: "Interviewer", value: summary.interviewer_segments || 0 },
              { label: "Candidate", value: summary.candidate_segments || 0 },
              { label: "Q&A Pairs", value: summary.qa_pairs || 0 },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-3xl font-bold text-foreground">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Animated Progress Line */}
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1 }}
          >
            <Progress value={100} className="h-2 mt-2" />
          </motion.div>

          {/* ✅ Transcription Segments */}
          <motion.div
            className="space-y-6 mt-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {transcription.transcription?.map((segment, idx) => (
              <motion.div
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 150 }}
                className={`p-4 rounded-lg border-l-4 transition-colors duration-300 ${
                  segment.speaker === "interviewer"
                    ? "bg-muted/40 border-primary hover:shadow-md"
                    : "bg-muted/30 border-accent hover:shadow-md"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    {segment.speaker === "interviewer" ? (
                      <Volume2 className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-accent" />
                    )}
                    <span className="font-semibold capitalize text-foreground">
                      {segment.speaker}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(segment.start_time)} -{" "}
                    {formatTime(segment.end_time)}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {segment.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
