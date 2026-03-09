import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  Video,
  TrendingUp,
  Calendar,
  Clock,
  Play,
  Plus,
  ArrowRight,
  Activity,
} from "lucide-react";
import { getCandidatesList, getRecentInterviews } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import DashboardStats from "@/components/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Home = () => {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    completedInterviews: 0,
    averageScore: 0,
    successRate: 0,
  });
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch candidates data
        const candidatesResponse = await getCandidatesList();
        const candidates = candidatesResponse.data?.candidates || [];

        if (!Array.isArray(candidates)) {
          console.error("Candidates data is not an array:", candidates);
          setLoading(false);
          return;
        }

        // Fetch recent interviews
        const interviewsResponse = await getRecentInterviews(3);
        const interviews = interviewsResponse.data || [];

        const completed = candidates.filter((c) => c.interview_count > 0);

        // Calculate stats
        setStats({
          totalCandidates: candidates.length,
          completedInterviews: completed.length,
          averageScore: 78, // Mock data - would come from API
          successRate: 85, // Mock data - would come from API
        });

        // Set recent interviews
        setRecentInterviews(interviews);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const upcomingInterviews = [
    { id: 4, candidate: "Sarah Wilson", role: "UI/UX Designer", date: "2024-03-09", time: "10:00 AM" },
    { id: 5, candidate: "Tom Brown", role: "DevOps Engineer", date: "2024-03-09", time: "2:00 PM" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your interview overview.</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/select-role"
            state={{ from: 'dashboard' }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-md 
              hover:from-blue-600 hover:to-purple-700 transition-all duration-300 group"
          >
            <Play className="h-5 w-5" />
            Start Interview
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          
          <Link
            to="/create-candidate"
            className="flex items-center gap-2 bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl shadow-md 
              hover:bg-slate-50 transition-all duration-300 group"
          >
            <Plus className="h-5 w-5" />
            New Candidate
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Interviews */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInterviews.map((interview, index) => (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{interview.candidate_name}</p>
                        <p className="text-sm text-muted-foreground">{interview.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{interview.score ? `${interview.score}%` : 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(interview.created_at).toLocaleDateString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Interviews */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingInterviews.map((interview, index) => (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Video className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{interview.candidate}</p>
                        <p className="text-sm text-muted-foreground">{interview.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{interview.date}</p>
                      <p className="text-xs text-muted-foreground">{interview.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
