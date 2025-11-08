import { motion } from "framer-motion"; // 🌀 Framer Motion
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";

export default function CompareCandidates() {
  const location = useLocation();
  const candidates = location.state?.candidates || [];

  if (candidates.length === 0) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.p
          className="text-muted-foreground text-lg"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          No candidates selected for comparison.
        </motion.p>

        <Link to="/history">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to History
            </Button>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* ✅ Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold text-foreground">
          Candidate Comparison
        </h1>
        <Link to="/history">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to History
            </Button>
          </motion.div>
        </Link>
      </motion.div>

      {/* ✅ Comparison Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
      >
        {candidates.map((c, index) => (
          <motion.div
            key={c.interview_id}
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ type: "spring", stiffness: 120 }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0px 6px 18px rgba(0,0,0,0.1)",
            }}
          >
            <Card className="border-border shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-center">
                  {c.candidate_name}
                </CardTitle>
                <p className="text-center text-muted-foreground text-sm">
                  {c.grade || "N/A"}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <p className="text-3xl font-bold">
                    {c.overall_score?.toFixed(1) || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Overall Score
                  </p>
                </motion.div>

                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
                >
                  <Progress value={c.overall_score || 0} className="h-2" />
                </motion.div>

                <div className="text-sm space-y-1">
                  <p>
                    🎯 <strong>Status:</strong> {c.status}
                  </p>
                  <p>
                    📈 <strong>Success Probability:</strong>{" "}
                    {c.success_probability?.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
