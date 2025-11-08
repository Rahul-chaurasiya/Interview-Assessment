import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // 🌀 Added Framer Motion
import { getInterviewHistory } from "../services/api";
import ResultsCard from "../components/ResultsCard";
import { AlertCircle, Brain, Heart } from "lucide-react";

export default function InterviewHistory() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await getInterviewHistory(id);
        setData(res.data);
      } catch (error) {
        console.error("❌ Error fetching interview details:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] text-gray-600"
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
          className="rounded-full h-12 w-12 border-b-2 border-primary"
        />
        <motion.p
          className="mt-4 text-lg font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Loading interview...
        </motion.p>
      </motion.div>
    );
  }

  if (!data)
    return (
      <motion.p
        className="text-center text-muted-foreground mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        No interview found.
      </motion.p>
    );

  const { candidate, interview, assessment, logs } = data;

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* ✅ Page Header */}
      <motion.div
        className="text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-foreground">
          Interview #{interview.id} - {candidate?.name}
        </h2>
        <p className="text-muted-foreground mt-2">
          Status:{" "}
          <span className="font-medium text-primary">{interview.status}</span>{" "}
          | Position:{" "}
          <span className="font-medium text-primary">
            {candidate?.position || "N/A"}
          </span>
        </p>
      </motion.div>

      {/* ✅ Assessment Results */}
      <AnimatePresence>
        {assessment && (
          <motion.div
            key="results-card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
          >
            <ResultsCard assessment={assessment} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ AI Evaluation Logs */}
      <motion.div
        className="bg-white border border-border rounded-xl shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h3
          className="flex items-center text-lg font-semibold text-[#1A4D2E] mb-4"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Brain size={20} className="mr-2 text-accent" /> AI Evaluation Logs
        </motion.h3>

        {logs?.length === 0 ? (
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No logs available
          </motion.p>
        ) : (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {logs.map((log, index) => (
              <motion.div
                key={log.id || index}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h4 className="flex items-center text-sm font-semibold text-gray-700">
                  {log.type === "EMOTION" ? (
                    <Heart size={16} color="#e11d48" className="mr-2" />
                  ) : (
                    <AlertCircle size={16} className="mr-2 text-blue-500" />
                  )}
                  {log.type}
                </h4>
                <pre className="mt-2 text-xs bg-white p-2 rounded border text-gray-700 overflow-x-auto">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
