
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ShowQuestions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from navigation state
  const { 
    role, 
    questions, 
    questionCount, 
    difficulty, 
    sequencing, 
    candidateInfo, 
    from 
  } = location.state || {};
  
  // State to track which questions have their answers visible
  const [showAnswers, setShowAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Toggle answer visibility for a specific question
  const toggleAnswer = (index) => {
    setShowAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Handle proceed with interview flow
  const handleProceed = () => {
    // Check if candidate exists and flow logic
    if (from === 'candidate-card' && candidateInfo) {
      // Flow 2: Candidate exists - Start interview directly
      navigate("/live-interview-v2", { 
        state: {
          candidateId: candidateInfo.id,
          candidateName: candidateInfo.name,
          candidateEmail: candidateInfo.email,
          role,
          questions
        } 
      });
    } else {
      // Flow 1: No candidate - Go to create candidate
      navigate("/create-candidate", { 
        state: { 
          role,
          questions,
          questionCount,
          difficulty,
          sequencing,
          from: 'dashboard'
        } 
      });
    }
  };
  
  // Handle back to SelectRole
  const handleBack = () => {
    navigate("/select-role");
  };
  
  // Validate questions exist
  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-border shadow-lg">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No questions found. Please generate questions first.</p>
            <Button onClick={() => navigate("/select-role")}>
              Go Back to Select Role
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  // Dynamic category labels - maps category keys to display names
  const categoryLabels: Record<string, string> = {
    "technical": "Technical",
    "hr": "HR",
    "behavioral": "Behavioral",
    "role_based": "Role Based"
  };


  return (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Interview Questions
            </h1>
            <p className="text-muted-foreground mt-1">
              Review the questions and sample answers before starting the interview
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Role: <span className="font-medium text-foreground">{role}</span></p>
            <p className="text-sm text-muted-foreground">Questions: <span className="font-medium text-foreground">{questions.length}</span></p>
          </div>
        </div>
      </motion.div>

      {/* Questions List */}
      <div className="space-y-6 mb-8">
        {questions.map((q, index) => (
          <motion.div
            key={q.id || index}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="border-border shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        {q.question_text}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                          {categoryLabels[q.category] || q.category}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                          {q.difficulty}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
                          {q.topic}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Show Answer Toggle - Eye Icon Only */}
                  <div 
                    className="cursor-pointer text-sm text-foreground flex items-center space-x-1"
                    onClick={() => toggleAnswer(index)}
                  >
                    {showAnswers[index] ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>Hide Answer</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Show Answer</span>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {/* Answer Section - Only visible when answer is toggled */}
              {showAnswers[index] && (
                <CardContent className="pt-0">
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-accent/10 border border-accent/30 rounded-lg"
                  >
                    <div className="flex items-start space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Sample Answer:</p>
                        <p className="text-sm text-muted-foreground">
                          {q.ideal_answer || q.sample_answer || q.answer || "No sample answer available for this question. The interviewer should evaluate the candidate's response based on the question asked."}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={handleBack}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Configuration</span>
        </Button>
        
        <Button
          onClick={handleProceed}
          disabled={loading}
          className="bg-[#1A4D2E] hover:bg-[#163E25] text-white font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {candidateInfo ? 'Start Live Interview' : 'Proceed to Interview'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default ShowQuestions;

