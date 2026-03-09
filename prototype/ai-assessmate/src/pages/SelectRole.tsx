import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { 
  Briefcase, 
  Settings, 
  Shuffle, 
  ListOrdered, 
  ArrowRight,
  CheckCircle2,
  Loader2,
  User
} from "lucide-react";
import { getConfigRoles, getConfigCategories, getConfigDifficulties, generateQuestions } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const SelectRole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Candidate state from navigation
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [isFromCandidateCard, setIsFromCandidateCard] = useState(false);
  
  // Data states
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Form states
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [difficulty, setDifficulty] = useState("intermediate");
  const [questionCount, setQuestionCount] = useState(5);
  const [sequencing, setSequencing] = useState("random");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [showQuestionsFirst, setShowQuestionsFirst] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Stepper steps
  const steps = [
    { id: 'role', label: 'Select Role', description: 'Choose job position' },
    { id: 'categories', label: 'Categories', description: 'Select question topics' },
    { id: 'settings', label: 'Settings', description: 'Difficulty & count' },
    { id: 'generate', label: 'Generate', description: 'Create questions' }
  ];

  // Handle navigation state on mount
  useEffect(() => {
    const state = location.state || {};
    const searchParams = new URLSearchParams(location.search);
    const from = state.from || searchParams.get('from');
    
    if (from === 'candidate-card') {
      // Try to get candidate info from state first, then from URL params
      const candidateId = state.candidateId || searchParams.get('candidateId');
      const candidateName = state.candidateName || searchParams.get('candidateName');
      const candidateEmail = state.candidateEmail || searchParams.get('candidateEmail');
      
      if (candidateId) {
        // Flow 2: Coming from candidate card
        setCandidateInfo({
          id: candidateId,
          name: candidateName || 'Unknown Candidate',
          email: candidateEmail || ''
        });
        setIsFromCandidateCard(true);
      }
    } else if (from === 'dashboard') {
      // Flow 1: Coming from dashboard
      setCandidateInfo(null);
      setIsFromCandidateCard(false);
    }
  }, [location.state, location.search]);

  // Fetch roles and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, categoriesRes] = await Promise.all([
          getConfigRoles(),
          getConfigCategories()
        ]);
        
        console.log("Roles response:", rolesRes);
        console.log("Categories response:", categoriesRes);
        
        // Handle roles data - API returns objects with id and name
        let rolesData = [];
        if (rolesRes?.data && Array.isArray(rolesRes.data)) {
          rolesData = rolesRes.data;
        } else if (Array.isArray(rolesRes)) {
          rolesData = rolesRes;
        }
        
        // Set roles (no fallback - data must come from database)
        if (rolesData.length > 0) {
          setRoles(rolesData);
        }

        // Handle categories data - API returns objects with key and name
        let categoriesData = [];
        if (categoriesRes?.data && Array.isArray(categoriesRes.data)) {
          categoriesData = categoriesRes.data;
        } else if (Array.isArray(categoriesRes)) {
          categoriesData = categoriesRes;
        }
        
        // Set categories (no fallback - data must come from database)
        if (categoriesData.length > 0) {
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load roles and categories from server",
          variant: "destructive",
        });
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, []);

  // Handle category toggle
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Generate questions
  const handleGenerateQuestions = async () => {
    if (!selectedRole) {
      toast({
        title: "Validation Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    if (selectedCategories.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one category",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await generateQuestions({
        role: selectedRole,
        categories: selectedCategories,
        difficulty: difficulty,
        question_count: questionCount,
        shuffle: sequencing === "random"
      });
      
      const questions = response.data || response;
      setGeneratedQuestions(questions);
      
      toast({
        title: "Success",
        description: `Generated ${questions.length} questions`,
      });
    } catch (error) {
      console.error("Failed to generate questions:", error);
      toast({
        title: "Error",
        description: "Failed to generate questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Proceed with interview flow
  const handleProceed = () => {
    if (generatedQuestions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please generate questions first",
        variant: "destructive",
      });
      return;
    }

    const navigationState = {
      role: selectedRole,
      questions: generatedQuestions,
      questionCount,
      difficulty,
      sequencing,
      candidateInfo: candidateInfo,
      from: isFromCandidateCard ? 'candidate-card' : 'dashboard'
    };

    // If user wants to see questions first, navigate to ShowQuestions page
    if (showQuestionsFirst) {
      navigate("/show-questions", { state: navigationState });
      return;
    }

    // Check candidate existence and flow logic
    if (isFromCandidateCard && candidateInfo) {
      // Flow 2: Candidate exists (from candidate card) - Start interview directly
      navigate("/live-interview-v2", { 
        state: {
          candidateId: candidateInfo.id,
          candidateName: candidateInfo.name,
          candidateEmail: candidateInfo.email,
          role: selectedRole,
          questions: generatedQuestions
        } 
      });
    } else {
      // Flow 1: No candidate (from dashboard) - Go to create candidate
      navigate("/create-candidate", { state: navigationState });
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto p-6"
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Select Role & Questions
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Choose interview settings for personalized assessment
            </p>
          </div>
          
          {candidateInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {candidateInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Interview for: {candidateInfo.name}
                </p>
                <p className="text-xs text-blue-700">
                  {candidateInfo.email}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stepper */}
      <motion.div
        className="mb-8"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Stepper 
          steps={steps} 
          currentStep={currentStep}
          completed={currentStep > 1 ? [0] : []}
        />
      </motion.div>

      {/* Main Content - Multi-page Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Page - Configuration */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <span>Select Job Role</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {roles.map((role) => (
                      <motion.div
                        key={role.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div 
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            selectedRole === role.id 
                              ? 'border-primary bg-primary/10 shadow-md' 
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedRole(role.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                              selectedRole === role.id 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {selectedRole === role.id && (
                                <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                              )}
                            </div>
                            <span className="font-medium text-foreground">{role.name}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>Question Categories</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <motion.div
                        key={category.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div 
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            selectedCategories.includes(category.key)
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                          onClick={() => handleCategoryToggle(category.key)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                              selectedCategories.includes(category.key)
                                ? 'border-primary bg-primary flex items-center justify-center'
                                : 'border-muted-foreground'
                            }`}>
                              {selectedCategories.includes(category.key) && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="font-medium text-foreground">
                              {category.name || category.key}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-foreground">Interview Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Difficulty */}
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">Difficulty Level</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {["beginner", "intermediate", "advanced", "expert"].map((level) => (
                        <motion.div
                          key={level}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div 
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 capitalize ${
                              difficulty === level
                                ? 'border-primary bg-primary/10 shadow-md'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                            onClick={() => setDifficulty(level)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                                difficulty === level
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground'
                              }`}>
                                {difficulty === level && (
                                  <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                                )}
                              </div>
                              <span className="font-medium text-foreground">{level}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Question Count */}
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">Number of Questions</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[3, 5, 7, 10, 15].map((count) => (
                        <motion.div
                          key={count}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div 
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              questionCount === count
                                ? 'border-primary bg-primary/10 shadow-md'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                            onClick={() => setQuestionCount(count)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                                questionCount === count
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground'
                              }`}>
                                {questionCount === count && (
                                  <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                                )}
                              </div>
                              <span className="font-medium text-foreground">{count}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Sequencing */}
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-3">Question Sequencing</h3>
                    <div className="space-y-3">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div 
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            sequencing === 'random'
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                          onClick={() => setSequencing('random')}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                              sequencing === 'random'
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}>
                              {sequencing === 'random' && (
                                <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                              )}
                            </div>
                            <Shuffle className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">Randomized</span>
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div 
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            sequencing === 'structured'
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                          onClick={() => setSequencing('structured')}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                              sequencing === 'structured'
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}>
                              {sequencing === 'structured' && (
                                <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                              )}
                            </div>
                            <ListOrdered className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">Structured (by category)</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-foreground">Generate Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={loading || !selectedRole || selectedCategories.length === 0}
                    className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        <span>Generating Questions...</span>
                      </>
                    ) : (
                      <>
                        <Settings className="h-5 w-5 mr-3" />
                        <span>Generate Questions</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6"
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                if (currentStep < 4) {
                  setCurrentStep(currentStep + 1);
                } else {
                  handleProceed();
                }
              }}
              disabled={(currentStep === 1 && !selectedRole) || (currentStep === 2 && selectedCategories.length === 0)}
              className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {currentStep < 4 ? 'Next' : (candidateInfo ? 'Start Interview' : 'Continue')}
            </Button>
          </div>
        </div>

        {/* Right Page - Preview */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-border shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>Questions Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedQuestions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Complete all steps to generate questions</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {generatedQuestions.map((q, index) => (
                      <div 
                        key={q.id || index} 
                        className="p-4 border rounded-lg bg-secondary/20"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {q.question_text}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                                {q.category}
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Show Questions First Option */}
          {generatedQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div 
                className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                onClick={() => setShowQuestionsFirst(!showQuestionsFirst)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                    showQuestionsFirst
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}>
                    {showQuestionsFirst && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">Show questions with answers before starting interview</div>
                    <div className="text-sm text-muted-foreground">Preview interview questions and sample answers</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SelectRole;
