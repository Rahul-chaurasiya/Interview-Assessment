import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // 🌀 Added Framer Motion
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Calendar,
  User,
  Briefcase,
  Eye,
  Award,
  CheckSquare,
} from "lucide-react";
import { getAllInterviews } from "@/services/api";

export default function History() {
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await getAllInterviews();
        const data = res.items || [];
        setInterviews(data);
        setFilteredInterviews(data);
      } catch (error) {
        console.error("❌ Error fetching interview history:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  useEffect(() => {
    const filtered = interviews.filter(
      (interview) =>
        interview.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.grade?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInterviews(filtered);
  }, [searchTerm, interviews]);

  const getBadge = (grade) => {
    if (!grade) return { text: "N/A", className: "bg-gray-400 text-white" };
    if (grade.startsWith("A")) return { text: grade, className: "bg-green-500 text-white" };
    if (grade.startsWith("B")) return { text: grade, className: "bg-blue-500 text-white" };
    if (grade.startsWith("C")) return { text: grade, className: "bg-yellow-500 text-white" };
    return { text: grade, className: "bg-red-500 text-white" };
  };

  const toggleSelection = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    const candidates = filteredInterviews.filter((i) =>
      selected.includes(i.interview_id)
    );
    navigate("/compare", { state: { candidates } });
  };

  if (loading) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-[60vh]"
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
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* ✅ Header Section */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interview History</h1>
          <p className="text-muted-foreground mt-1">
            View and compare completed interview assessments
          </p>
        </div>

        <AnimatePresence>
          {selected.length >= 2 && (
            <motion.div
              key="compare-button"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Button
                onClick={handleCompare}
                className="bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Compare {selected.length} Candidates
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ✅ Search Bar */}
      <motion.div
        className="relative"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by candidate name, grade, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-input focus:ring-primary"
        />
      </motion.div>

      {/* ✅ Main Content */}
      <AnimatePresence>
        {filteredInterviews.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-border shadow-lg">
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  No interview history found
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="interviews"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
          >
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                  All Interviews ({filteredInterviews.length})
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {filteredInterviews.map((interview, index) => {
                    const badge = getBadge(interview.grade);
                    const isSelected = selected.includes(interview.interview_id);
                    return (
                      <motion.div
                        key={interview.interview_id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{
                          scale: 1.02,
                          transition: { type: "spring", stiffness: 250 },
                        }}
                      >
                        <div
                          className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                            isSelected
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-secondary"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <motion.input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleSelection(interview.interview_id)
                              }
                              className="mt-1 h-5 w-5 cursor-pointer accent-primary"
                              whileTap={{ scale: 0.9 }}
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <User className="h-5 w-5 text-primary" />
                                <span className="font-semibold text-foreground text-lg">
                                  {interview.candidate_name ||
                                    "Unknown Candidate"}
                                </span>
                                <Badge className={badge.className}>
                                  {badge.text}
                                </Badge>
                              </div>

                              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-2">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{interview.status || "N/A"}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(
                                      interview.created_at
                                    ).toLocaleString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center text-sm">
                                <Award className="h-4 w-4 mr-1 text-accent" />
                                <span className="text-muted-foreground">
                                  Score:
                                </span>
                                <span className="ml-2 font-bold text-foreground">
                                  {interview.overall_score
                                    ? `${interview.overall_score.toFixed(2)}%`
                                    : "N/A"}
                                </span>
                                <span className="ml-4 text-muted-foreground">
                                  (Success Probability:{" "}
                                  {interview.success_probability
                                    ? `${interview.success_probability.toFixed(
                                        1
                                      )}%`
                                    : "N/A"}
                                  )
                                </span>
                              </div>
                            </div>
                          </div>

                          <Link to={`/view-results/${interview.interview_id}`}>
                            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                              <Eye className="h-4 w-4 mr-2" />
                              View Results
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}




// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Search,
//   Calendar,
//   User,
//   Award,
//   BarChart2,
//   TrendingUp,
//   Eye,
// } from "lucide-react";
// import { getCandidateHistory } from "@/services/api"; // ✅ using old functionality
// // import LoadingSpinner from "@/components/LoadingSpinner"; // old loader style (you can replace with skeleton if needed)

// export default function History() {
//   const navigate = useNavigate();
//   const [candidate, setCandidate] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [filtered, setFiltered] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");

//   const candidateId = 1; // ✅ replace with logged-in or selected candidate later

//   useEffect(() => {
//     async function fetchHistory() {
//       try {
//         const res = await getCandidateHistory(candidateId);
//         setCandidate(res.data.candidate);
//         setHistory(res.data.history);
//         setFiltered(res.data.history);
//       } catch (err) {
//         console.error("❌ Error fetching candidate history:", err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchHistory();
//   }, []);

//   useEffect(() => {
//     const f = history.filter(
//       (item) =>
//         item.interview?.id
//           ?.toString()
//           .toLowerCase()
//           .includes(search.toLowerCase()) ||
//         item.interview?.status?.toLowerCase().includes(search.toLowerCase())
//     );
//     setFiltered(f);
//   }, [search, history]);

//   const getGradeColor = (grade) => {
//     if (!grade) return "text-muted-foreground";
//     if (grade.startsWith("A")) return "text-green-600";
//     if (grade.startsWith("B")) return "text-blue-500";
//     if (grade.startsWith("C")) return "text-amber-500";
//     return "text-red-500";
//   };

//   const getBorderColor = (grade) => {
//     if (!grade) return "#999";
//     if (grade.startsWith("A")) return "#10b981";
//     if (grade.startsWith("B")) return "#3b82f6";
//     if (grade.startsWith("C")) return "#f59e0b";
//     return "#ef4444";
//   };

//   const handleView = (id) => {
//     navigate(`/results/${id}`);
//   };

//   // if (loading) return <LoadingSpinner text="Loading history..." />;

//   if (!candidate)
//     return (
//       <div className="text-center py-12 text-muted-foreground">
//         No candidate data found.
//       </div>
//     );

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-foreground">
//           Interview History for {candidate.name}
//         </h1>
//         <p className="text-muted-foreground mt-1">
//           Position: {candidate.position} | Email: {candidate.email}
//         </p>
//       </div>

//       {/* 🔍 Search */}
//       <div className="relative max-w-md">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
//         <Input
//           type="text"
//           placeholder="Search by interview ID or status..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="pl-10 border-input focus:ring-primary"
//         />
//       </div>

//       {/* 📄 History Grid */}
//       {filtered.length === 0 ? (
//         <Card className="border-border shadow-lg">
//           <CardContent className="text-center py-12">
//             <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
//             <p className="text-muted-foreground text-lg">
//               No interview history found
//             </p>
//             {search && (
//               <p className="text-muted-foreground mt-2">
//                 Try adjusting your search
//               </p>
//             )}
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {filtered.map((entry) => {
//             const interview = entry.interview;
//             const assessment = entry.assessment;
//             const grade = assessment?.grade;

//             return (
//               <Card
//                 key={interview.id}
//                 className="shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
//                 style={{
//                   borderLeft: `6px solid ${getBorderColor(grade)}`,
//                 }}
//                 onClick={() => handleView(interview.id)}
//               >
//                 <CardHeader>
//                   <CardTitle className="flex items-center justify-between text-lg font-semibold text-foreground">
//                     <div className="flex items-center gap-2">
//                       <Award className="h-5 w-5 text-primary" />
//                       Interview #{interview.id}
//                     </div>
//                     <Badge variant="outline">{interview.status}</Badge>
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                   {assessment ? (
//                     <>
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <p className="text-sm text-muted-foreground">
//                             Overall Score
//                           </p>
//                           <p className="text-xl font-bold text-foreground">
//                             {assessment.overall_score?.toFixed(1)}%
//                           </p>
//                         </div>
//                         <div className="text-right">
//                           <p
//                             className={`text-lg font-semibold ${getGradeColor(
//                               grade
//                             )}`}
//                           >
//                             {grade || "N/A"}
//                           </p>
//                         </div>
//                       </div>

//                       <div className="flex items-center justify-between text-sm text-muted-foreground">
//                         <p className="flex items-center gap-1">
//                           <BarChart2 className="h-4 w-4" /> Success Probability:{" "}
//                           {assessment.success_probability?.toFixed(1)}%
//                         </p>
//                         <p className="flex items-center gap-1">
//                           <TrendingUp className="h-4 w-4" /> Score:{" "}
//                           {assessment.overall_score?.toFixed(1)}
//                         </p>
//                       </div>
//                     </>
//                   ) : (
//                     <p className="text-muted-foreground">
//                       No assessment data yet
//                     </p>
//                   )}

//                   <div className="flex justify-end">
//                     <Button
//                       variant="default"
//                       className="bg-primary hover:bg-primary/90"
//                     >
//                       <Eye className="h-4 w-4 mr-2" />
//                       View Results
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }





// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Search, Calendar, User, Briefcase, Eye } from 'lucide-react';
// import { getCandidatesList } from '@/services/api';

// const History = () => {
//   const [interviews, setInterviews] = useState([]);
//   const [filteredInterviews, setFilteredInterviews] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchHistory = async () => {
//       try {
//         const response = await getCandidatesList();
//         const completed = response.data.filter((c: any) => c.assessment);
//         setInterviews(completed);
//         setFilteredInterviews(completed);
//       } catch (error) {
//         console.error('Failed to fetch history:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchHistory();
//   }, []);

//   useEffect(() => {
//     const filtered = interviews.filter((interview: any) =>
//       interview.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       interview.email.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//     setFilteredInterviews(filtered);
//   }, [searchTerm, interviews]);

//   const getStatusBadge = (score: number) => {
//     if (score >= 85) return { text: 'Excellent', variant: 'default' as const, className: 'bg-success text-success-foreground' };
//     if (score >= 70) return { text: 'Good', variant: 'default' as const, className: 'bg-info text-info-foreground' };
//     if (score >= 55) return { text: 'Average', variant: 'default' as const, className: 'bg-warning text-warning-foreground' };
//     return { text: 'Needs Improvement', variant: 'destructive' as const, className: 'bg-destructive text-destructive-foreground' };
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[50vh]">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-foreground">Interview History</h1>
//         <p className="text-muted-foreground mt-1">View all completed interview assessments</p>
//       </div>

//       <div className="relative">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
//         <Input
//           type="text"
//           placeholder="Search by candidate name or email..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="pl-10 border-input focus:ring-primary"
//         />
//       </div>

//       {filteredInterviews.length === 0 ? (
//         <Card className="border-border shadow-lg">
//           <CardContent className="text-center py-12">
//             <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
//             <p className="text-muted-foreground text-lg">No interview history found</p>
//             {searchTerm && (
//               <p className="text-muted-foreground mt-2">Try adjusting your search</p>
//             )}
//           </CardContent>
//         </Card>
//       ) : (
//         <Card className="border-border shadow-lg">
//           <CardHeader>
//             <CardTitle className="text-xl font-bold text-foreground">All Interviews</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {filteredInterviews.map((interview: any) => {
//                 const statusBadge = getStatusBadge(interview.assessment.overall_score);
//                 return (
//                   <div
//                     key={interview.id}
//                     className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition-colors"
//                   >
//                     <div className="flex-1 space-y-2">
//                       <div className="flex items-center space-x-3">
//                         <User className="h-5 w-5 text-primary" />
//                         <span className="font-semibold text-foreground text-lg">{interview.name}</span>
//                         <Badge className={statusBadge.className}>{statusBadge.text}</Badge>
//                       </div>
                      
//                       <div className="flex items-center space-x-6 text-sm text-muted-foreground">
//                         <div className="flex items-center space-x-2">
//                           <Briefcase className="h-4 w-4" />
//                           <span>{interview.position}</span>
//                         </div>
//                         <div className="flex items-center space-x-2">
//                           <Calendar className="h-4 w-4" />
//                           <span>{new Date(interview.created_at).toLocaleDateString()}</span>
//                         </div>
//                       </div>
                      
//                       <div className="text-sm">
//                         <span className="text-muted-foreground">Score: </span>
//                         <span className="font-bold text-foreground">{interview.assessment.overall_score}%</span>
//                       </div>
//                     </div>
                    
//                     <Link to={`/results/${interview.id}`}>
//                       <Button className="bg-primary hover:bg-primary-light text-primary-foreground font-semibold">
//                         <Eye className="h-4 w-4 mr-2" />
//                         View Results
//                       </Button>
//                     </Link>
//                   </div>
//                 );
//               })}
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };

// export default History; 
