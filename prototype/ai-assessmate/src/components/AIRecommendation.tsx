import { motion } from "framer-motion"; // 🌀 Framer Motion
import { CheckCircle, AlertCircle, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AIRecommendation({ recommendation }) {
  if (!recommendation) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border border-muted mt-6">
          <CardContent className="text-center py-8 text-muted-foreground">
            No AI recommendation available for this interview.
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const {
    decision,
    summary,
    strengths = [],
    weaknesses = [],
    development_plan = [],
    readiness,
    next_steps,
    icon,
    color,
    ai_generated,
  } = recommendation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Card className="border border-muted mt-6 shadow-md">
        {/* ✅ Header */}
        <CardHeader>
          <motion.div
            className="flex items-center gap-2 text-lg font-semibold"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span
              className="text-2xl"
              style={{ color: color || "#3b82f6" }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {icon || "🤖"}
            </motion.span>
            <span>AI Recommendation</span>
            {ai_generated && (
              <span className="text-xs text-muted-foreground ml-auto">
                AI Generated
              </span>
            )}
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ✅ Decision + Summary */}
          <motion.div
            className="rounded-lg border p-4"
            style={{
              borderColor: color || "#3b82f6",
              background: `${color}15`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <AlertCircle className="h-5 w-5" style={{ color }} />
              </motion.div>
              Decision: <span style={{ color }}>{decision}</span>
            </h3>
            <p className="mt-2 text-muted-foreground">{summary}</p>
          </motion.div>

          {/* ✅ Strengths & Weaknesses */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            {/* Strengths */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02 }}
              className="border rounded-lg p-4"
            >
              <h4 className="font-semibold flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Strengths
              </h4>
              {strengths.length > 0 ? (
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  {strengths.map((s, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {s}
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-2">
                  No strengths identified.
                </p>
              )}
            </motion.div>

            {/* Weaknesses */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02 }}
              className="border rounded-lg p-4"
            >
              <h4 className="font-semibold flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Weaknesses
              </h4>
              {weaknesses.length > 0 ? (
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  {weaknesses.map((w, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {w}
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-2">
                  No weaknesses identified.
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* ✅ Development Plan */}
          {development_plan.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5" />
                Development Plan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {development_plan.map((item, i) => (
                  <motion.div
                    key={i}
                    className="border rounded-lg p-4 bg-muted/30 shadow-sm"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <p className="font-semibold text-foreground">
                      Area: {item.area}
                    </p>
                    <p className="text-sm mt-1">Action: {item.action}</p>
                    {item.resources?.length > 0 && (
                      <ul className="list-disc list-inside text-sm mt-2 text-muted-foreground">
                        {item.resources.map((r, j) => (
                          <li key={j}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ✅ Readiness & Next Steps */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="border rounded-lg p-4"
              whileHover={{ scale: 1.03 }}
            >
              <h4 className="font-semibold text-foreground">Readiness</h4>
              <p className="text-muted-foreground mt-1">
                {readiness || "N/A"}
              </p>
            </motion.div>
            <motion.div
              className="border rounded-lg p-4"
              whileHover={{ scale: 1.03 }}
            >
              <h4 className="font-semibold text-foreground">Next Steps</h4>
              <p className="text-muted-foreground mt-1">
                {next_steps || "N/A"}
              </p>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
