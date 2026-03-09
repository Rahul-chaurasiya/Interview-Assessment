import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  UserPlus,
  Filter,
} from "lucide-react";
import { getCandidatesList } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import CandidateCard from "@/components/CandidateCard";

export default function CandidatesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Handle interview completion success message
  useEffect(() => {
    const state = location.state;
    if (state?.interviewCompleted && state?.candidateName) {
      toast({
        title: "Interview Completed!",
        description: `Live interview with ${state.candidateName} completed successfully.`,
      });
      // Clear the state to prevent showing message again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await getCandidatesList();
        const data = response.data?.candidates || response.data || [];
        setCandidates(data);
        setFilteredCandidates(data);
      } catch (err) {
        console.error("❌ Error fetching candidates:", err);
        setError("Failed to load candidates.");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  useEffect(() => {
    const filtered = candidates.filter(
      (candidate) =>
        candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCandidates(filtered);
  }, [searchTerm, candidates]);

  if (loading) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-[50vh]"
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
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Professional Header */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                Candidates Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and monitor all candidate profiles and interview progress
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                {candidates.length} Total
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {filteredCandidates.length} Filtered
              </Badge>
              <Link to="/create-candidate">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Candidate
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search candidates by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <Button variant="outline" className="h-11 px-6">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </motion.div>

        {/* Results Summary */}
        {filteredCandidates.length > 0 && (
          <motion.div
            className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Showing {filteredCandidates.length} of {candidates.length} candidates
              </span>
            </div>
            {searchTerm && (
              <Badge variant="secondary" className="bg-white">
                Filtered by: "{searchTerm}"
              </Badge>
            )}
          </motion.div>
        )}

        {error && (
          <motion.div
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {/* Candidates Grid */}
        <AnimatePresence>
          {filteredCandidates.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="text-center py-16">
                  <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No candidates found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm 
                      ? "Try adjusting your search terms or filters"
                      : "Get started by adding your first candidate"
                    }
                  </p>
                  {!searchTerm && (
                    <Link to="/create-candidate">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create First Candidate
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="candidates"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
              {filteredCandidates.map((candidate) => (
                <motion.div
                  key={candidate.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <CandidateCard
                    candidate={candidate}
                    onLiveInterview={(candidate) => {
                      navigate("/select-role", {
                        state: {
                          candidateId: candidate.id,
                          candidateName: candidate.name,
                          candidateEmail: candidate.email,
                          from: 'candidate-card'
                        }
                      });
                    }}
                    onRecordedInterview={(candidate) => {
                      navigate(`/record/${candidate.id}`);
                    }}
                    onViewProfile={async (candidate) => {
                      // Get the latest interview for this candidate
                      try {
                        const response = await fetch(`http://localhost:8000/interview/candidate/${candidate.id}/latest`);
                        const data = await response.json();
                        
                        if (data.success && data.interview_id) {
                          navigate(`/view-results/${data.interview_id}`);
                        } else {
                          // If no interview found, show message
                          toast({
                            title: "No Interview Found",
                            description: "This candidate has no completed interviews yet.",
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        console.error("Error fetching latest interview:", error);
                        toast({
                          title: "Error",
                          description: "Failed to fetch interview data.",
                          variant: "destructive"
                        });
                      }
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
