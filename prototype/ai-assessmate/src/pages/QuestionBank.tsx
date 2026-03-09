import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, Filter, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getRoles, getCategories, getQuestions } from "@/services/api";

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAnswers, setShowAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    category: '',
    difficulty: '',
    search: ''
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load questions when filters change
  useEffect(() => {
    if (roles.length > 0 || categories.length > 0) {
      loadQuestions();
    }
  }, [filters, roles, categories]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load roles and categories
      const [rolesRes, categoriesRes] = await Promise.all([
        getRoles(),
        getCategories()
      ]);

      setRoles(rolesRes.data || []);
      setCategories(categoriesRes.data?.categories || []);
      
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load question bank data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      
      const response = await getQuestions(
        filters.role || undefined,
        filters.category || undefined,
        undefined, // topic
        filters.difficulty || undefined,
        100 // limit
      );
      
      let questionsData = response.data || [];
      
      // Apply search filter locally if needed
      if (filters.search) {
        questionsData = questionsData.filter(q => 
          q.question_text.toLowerCase().includes(filters.search.toLowerCase()) ||
          q.ideal_answer?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setQuestions(questionsData);
    } catch (error) {
      console.error("Failed to load questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (index) => {
    setShowAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      category: '',
      difficulty: '',
      search: ''
    });
  };

  const categoryLabels = {
    "technical": "Technical",
    "hr": "HR",
    "behavioral": "Behavioral",
    "situational": "Situational",
    "role_based": "Role Based"
  };

  // Helper function to format role name
  const formatRoleName = (role) => {
    if (!role) return '';
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#1A4D2E]" />
          <p className="mt-4 text-lg text-gray-600">Loading question bank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Question Bank
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse and search interview questions from the database
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Questions</p>
            <p className="text-2xl font-bold text-[#1A4D2E]">{questions.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{categoryLabels[category] || category}</option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* Clear Filters */}
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, index) => (
          <Card key={q.id || index} className="border-border shadow-lg">
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
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        {formatRoleName(q.role)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Show Answer Toggle */}
                {q.ideal_answer && (
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
                )}
              </div>
            </CardHeader>
            
            {/* Answer Section */}
            {showAnswers[index] && q.ideal_answer && (
              <CardContent className="pt-0">
                <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-accent-foreground">A</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Ideal Answer:</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {q.ideal_answer}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* No Results */}
      {questions.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No questions found matching your filters.</p>
          <Button
            onClick={clearFilters}
            variant="outline"
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
