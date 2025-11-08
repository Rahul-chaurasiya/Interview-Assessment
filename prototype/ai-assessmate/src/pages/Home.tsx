import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle,
  TrendingUp,
  Award,
  ArrowRight,
  Activity,
  Zap,
} from "lucide-react";
import { getCandidatesList } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion"; // 🌀 Added Framer Motion
import demo from "../assets/demo video.mp4"; 

const Home = () => {
  const [stats, setStats] = useState({
    totalCandidates: 95,
    completedInterviews: 18,
    averageScore: 70,
    successRate: 90,
  });
  const [loading, setLoading] = useState(true);
  const [showDemo, setShowDemo] = useState(false);
  const [recentInterviews, setRecentInterviews] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getCandidatesList();
        const candidates = response.data;

        const completed = candidates.filter(
          (c) => c.assessment?.overall_score
        );
        const totalScore = completed.reduce(
          (sum, c) => sum + (c.assessment?.overall_score || 0),
          0
        );
        const avgScore =
          completed.length > 0 ? totalScore / completed.length : 0;
        const successCount = completed.filter(
          (c) => c.assessment?.overall_score >= 70
        ).length;
        const successRate =
          completed.length > 0
            ? (successCount / completed.length) * 100
            : 0;

        setStats({
          totalCandidates: candidates.length,
          completedInterviews: completed.length,
          averageScore: Math.round(avgScore),
          successRate: Math.round(successRate),
        });

        setRecentInterviews(completed.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* ✅ Hero Section */}
      <motion.section
        className="hero text-center py-16"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="hero-content">
          <motion.div
            className="hero-badge flex items-center justify-center gap-2 text-sm text-yellow-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span>✨</span>
            <span>AI-Powered Interview Evaluation</span>
          </motion.div>

          <motion.h1
            className="hero-title text-4xl font-bold mt-4 text-[#1A4D2E]"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Fair & Intelligent <br />
            Interview Assessment
          </motion.h1>

          <motion.p
            className="hero-subtitle text-green-900 max-w-2xl mx-auto mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Evaluate candidates objectively with AI-powered analysis. Real-time
            transcription, unbiased scoring, and actionable insights to make
            better hiring decisions.
          </motion.p>

          {/* 🎥 Buttons */}
          <motion.div
            className="flex justify-center gap-4 mt-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              to="/create-candidate"
              className="flex items-center gap-2 bg-[#1A4D2E] text-white px-6 py-3 rounded-xl shadow-md 
                hover:bg-[#163E25] transition-all duration-300 group"
            >
              Start Interview
              <ArrowRight
                size={20}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <button
              onClick={() => setShowDemo(true)}
              className="px-6 py-3 rounded-xl border-2 border-[#1A4D2E] text-[#1A4D2E]
                hover:bg-[#1A4D2E] hover:text-white transition-all duration-300"
            >
              Watch Demo
            </button>
          </motion.div>

          {/* 🎬 Animated Demo Video Modal */}
          <AnimatePresence>
            {showDemo && (
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-white rounded-2xl shadow-2xl w-[90%] md:w-[60%] p-4 relative"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    onClick={() => setShowDemo(false)}
                    className="absolute top-3 right-3 text-gray-600 hover:text-black text-2xl font-bold"
                  >
                    ×
                  </button>
                  <video
                    src={demo}
                    controls
                    autoPlay
                    className="w-full rounded-xl"
                  ></video>
                  <div className="text-center mt-3 text-gray-600 text-sm">
                    AI Interview System — Product Walkthrough
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ✅ Dashboard Stats */}
      <section>
        <motion.h2
          className="text-2xl font-bold text-[#1A4D2E] mb-4"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          Interview Overview
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[
            {
              title: "AI Evaluation Accuracy",
              value: stats.totalCandidates,
              icon: Users,
              color: "text-info",
            },
            {
              title: "Avg Interview Duration",
              value: stats.completedInterviews,
              icon: CheckCircle,
              color: "text-success",
            },
            {
              title: "Feedback Processed",
              value: `${stats.averageScore}%`,
              icon: TrendingUp,
              color: "text-accent",
            },
            {
              title: "Success Rate",
              value: `${stats.successRate}%`,
              icon: Award,
              color: "text-warning",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="border border-[#1A4D2E]/20 shadow-md hover:shadow-lg hover:scale-[1.03] transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#1A4D2E]">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ✅ Features Section */}
      <motion.section
        className="features-section py-12"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#1A4D2E]">
            Comprehensive Interview Solution
          </h2>
          <p className="text-gray-500">
            Everything you need for unbiased candidate evaluation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Activity size={24} />}
            title="Real-Time Transcription"
            text="Accurate speech-to-text with automatic speaker separation and timestamp tracking."
            list={[
              "Live transcription",
              "Speaker identification",
              "Multi-language support",
            ]}
          />
          <FeatureCard
            icon={<Zap size={24} />}
            title="AI Evaluation Engine"
            text="Advanced NLP and ML models for fair, unbiased candidate assessment."
            list={[
              "Competency analysis",
              "Bias-free scoring",
              "Detailed insights",
            ]}
          />
          <FeatureCard
            icon={<Users size={24} />}
            title="Candidate Management"
            text="Organize, compare, and track all candidate performances in one dashboard."
            list={[
              "Centralized database",
              "Comparative analytics",
              "Export reports",
            ]}
          />
        </div>
      </motion.section>

      {/* ✅ CTA Section */}
      <motion.section
        className="text-center py-12 bg-[#1A4D2E]/5 rounded-xl"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="cta-content">
          <h2 className="text-3xl font-bold text-[#1A4D2E]">
            Ready to revolutionize your hiring?
          </h2>
          <p className="text-gray-500 mt-2">
            Join teams using AI to make better hiring decisions
          </p>
          <Link to="/create-candidate" className="inline-block mt-4">
            <Button className="bg-[#1A4D2E] text-white hover:bg-[#163E25]">
              Create Your First Interview <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </motion.section>
    </motion.div>
  );
};

const FeatureCard = ({ icon, title, text, list }) => (
  <motion.div
    className="p-6 border border-[#1A4D2E]/20 rounded-lg shadow-sm hover:shadow-md bg-white"
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 200 }}
  >
    <div className="mb-4 text-[#1A4D2E]">{icon}</div>
    <h3 className="text-lg font-semibold text-[#1A4D2E]">{title}</h3>
    <p className="text-gray-500 mt-2">{text}</p>
    <ul className="mt-3 text-sm text-gray-600 space-y-1">
      {list.map((item) => (
        <li key={item}>✔ {item}</li>
      ))}
    </ul>
  </motion.div>
);

export default Home;






// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Users, CheckCircle, TrendingUp, Award, ArrowRight, Activity, Zap } from "lucide-react";
// import { getCandidatesList } from "@/services/api";

// const Home = () => {
//   const [stats, setStats] = useState({
//     totalCandidates: 95,
//     completedInterviews: 18,
//     averageScore: 70,
//     successRate: 90,
//   });
//   const [recentInterviews, setRecentInterviews] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await getCandidatesList();
//         const candidates = response.data;

//         const completed = candidates.filter((c) => c.assessment?.overall_score);
//         const totalScore = completed.reduce((sum, c) => sum + (c.assessment?.overall_score || 0), 0);
//         const avgScore = completed.length > 0 ? totalScore / completed.length : 0;
//         const successCount = completed.filter((c) => c.assessment?.overall_score >= 70).length;
//         const successRate = completed.length > 0 ? (successCount / completed.length) * 100 : 0;

//         setStats({
//           totalCandidates: candidates.length,
//           completedInterviews: completed.length,
//           averageScore: Math.round(avgScore),
//           successRate: Math.round(successRate),
//         });

//         setRecentInterviews(completed.slice(0, 5));
//       } catch (error) {
//         console.error("Failed to fetch data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const getGrade = (score) => {
//     if (score >= 85) return { grade: "A", color: "bg-success text-success-foreground" };
//     if (score >= 70) return { grade: "B", color: "bg-info text-info-foreground" };
//     if (score >= 55) return { grade: "C", color: "bg-warning text-warning-foreground" };
//     return { grade: "D", color: "bg-destructive text-destructive-foreground" };
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[50vh]">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-12">

//       {/* ✅ Hero Section (from original) */}
//       <section className="hero text-center py-16">
//         <div className="hero-content">
//           <div className="hero-badge">
//             <span className="badge-icon">✨</span>
//             <span>AI-Powered Interview Evaluation</span>
//           </div>

//           <h1 className="hero-title text-4xl font-bold mt-4">
//             Fair & Intelligent <br />
//             Interview Assessment
//           </h1>

//           <p className="hero-subtitle text-green-900 max-w-2xl mx-auto mt-4">
//             Evaluate candidates objectively with AI-powered analysis. Real-time transcription,
//             unbiased scoring, and actionable insights to make better hiring decisions.
//           </p>


// <div className="flex justify-center gap-4 mt-8">
//   {/* Start Interview Button */}
//  <Link
//   to="/create-candidate"
//   className="flex items-center gap-2 bg-[#1A4D2E] text-white px-6 py-3 rounded-xl shadow-md 
//              hover:bg-[#163E25] transition-all duration-300 group"
// >
//   Start Interview 
//   <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
// </Link>


//   {/* Watch Demo Button */}
//   <button
//     className="px-6 py-3 rounded-xl border-2 border-[#1A4D2E] text-[#1A4D2E] 
//                hover:bg-[#1A4D2E] hover:text-white transition-all duration-300"
//   >
//     Watch Demo
//   </button>
// </div>



//           {/* <div className=" justify-center gap-4 mt-6">
    

//           <div className="hero-buttons flex justify-center gap-4 mt-6 ">
//             <Link to="/create-candidate" className="btn btn-primary btn-lg">
//               Start Interview <ArrowRight size={20} />
//             </Link>
//             <button className="btn btn-outline btn-lg">Watch Demo</button>
//           </div>
//           </div> */}

//           {/* <div className="hero-stats flex justify-center gap-8 mt-10">
//             <div className="stat-item text-center">
//               <span className="stat-number text-2xl font-bold">10,000+</span>
//               <span className="stat-label text-gray-500 block">Interviews</span>
//             </div>
//             <div className="stat-item text-center">
//               <span className="stat-number text-2xl font-bold">95%</span>
//               <span className="stat-label text-gray-500 block">Accuracy</span>
//             </div>
//             <div className="stat-item text-center">
//               <span className="stat-number text-2xl font-bold">4.9★</span>
//               <span className="stat-label text-gray-500 block">Satisfaction</span>
//             </div>
//           </div> */}
//         </div>
//       </section>

//       {/* ✅ Lovable Dashboard (original Lovable part) */}
//       <div>
//         <h2 className="text-2xl font-bold text-foreground mb-4">Interview Overview</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {[
//             { title: "AI Evaluation Accuracy", value: stats.totalCandidates, icon: Users, color: "text-info" },
//             { title: "Avg Interview Duration", value: stats.completedInterviews, icon: CheckCircle, color: "text-success" },
//             { title: "Feedback Processed:", value: `${stats.averageScore}%`, icon: TrendingUp, color: "text-accent" },
//             { title: "Success Rate", value: `${stats.successRate}%`, icon: Award, color: "text-warning" },
//           ].map((stat) => (
//             <Card key={stat.title} className="border-border shadow-md hover:shadow-lg transition-shadow">
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
//                 <stat.icon className={`h-5 w-5 ${stat.color}`} />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-3xl font-bold text-foreground">{stat.value}</div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>

//       {/* ✅ Features Section (from original) */}
//       <section className="features-section py-12">
//         <div className="section-header text-center mb-10">
//           <h2 className="text-3xl font-bold">Comprehensive Interview Solution</h2>
//           <p className="text-gray-500">Everything you need for unbiased candidate evaluation</p>
//         </div>

//         <div className="features-grid grid md:grid-cols-3 gap-8">
//           <div className="feature-card p-6 border rounded-lg shadow-sm">
//             <div className="feature-icon mb-4 text-primary">
//               <Activity size={24} />
//             </div>
//             <h3 className="text-lg font-semibold">Real-Time Transcription</h3>
//             <p className="text-gray-500 mt-2">
//               Accurate speech-to-text with automatic speaker separation and timestamp tracking
//             </p>
//             <ul className="feature-list mt-3 text-sm text-gray-600 space-y-1">
//               <li>✔ Live transcription</li>
//               <li>✔ Speaker identification</li>
//               <li>✔ Multi-language support</li>
//             </ul>
//           </div>

//           <div className="feature-card p-6 border rounded-lg shadow-sm">
//             <div className="feature-icon mb-4 text-primary">
//               <Zap size={24} />
//             </div>
//             <h3 className="text-lg font-semibold">AI Evaluation Engine</h3>
//             <p className="text-gray-500 mt-2">
//               Advanced NLP and machine learning for fair, unbiased candidate assessment
//             </p>
//             <ul className="feature-list mt-3 text-sm text-gray-600 space-y-1">
//               <li>✔ Competency analysis</li>
//               <li>✔ Bias-free scoring</li>
//               <li>✔ Detailed insights</li>
//             </ul>
//           </div>

//           <div className="feature-card p-6 border rounded-lg shadow-sm">
//             <div className="feature-icon mb-4 text-primary">
//               <Users size={24} />
//             </div>
//             <h3 className="text-lg font-semibold">Candidate Management</h3>
//             <p className="text-gray-500 mt-2">
//               Organize, compare, and track all candidate performances in one dashboard
//             </p>
//             <ul className="feature-list mt-3 text-sm text-gray-600 space-y-1">
//               <li>✔ Centralized database</li>
//               <li>✔ Comparative analytics</li>
//               <li>✔ Export reports</li>
//             </ul>
//           </div>
//         </div>
//       </section>

//       {/* ✅ CTA Section (from original) */}
//       <section className="cta-section text-center py-12">
//         <div className="cta-content">
//           <h2 className="text-3xl font-bold">Ready to revolutionize your hiring?</h2>
//           <p className="text-gray-500 mt-2">Join teams using AI to make better hiring decisions</p>
//           <Link to="/create-candidate" className="inline-block mt-4">
//             <Button className="btn btn-primary btn-lg">
//               Create Your First Interview <ArrowRight size={20} />
//             </Button>
//           </Link>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Home;









// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Users, CheckCircle, TrendingUp, Award } from 'lucide-react';
// import { getCandidatesList } from '@/services/api';

// const Home = () => {
//   const [stats, setStats] = useState({
//     totalCandidates: 0,
//     completedInterviews: 0,
//     averageScore: 0,
//     successRate: 0,
//   });
//   const [recentInterviews, setRecentInterviews] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await getCandidatesList();
//         const candidates = response.data;
        
//         const completed = candidates.filter((c: any) => c.assessment?.overall_score);
//         const totalScore = completed.reduce((sum: number, c: any) => sum + (c.assessment?.overall_score || 0), 0);
//         const avgScore = completed.length > 0 ? totalScore / completed.length : 0;
//         const successCount = completed.filter((c: any) => c.assessment?.overall_score >= 70).length;
//         const successRate = completed.length > 0 ? (successCount / completed.length) * 100 : 0;

//         setStats({
//           totalCandidates: candidates.length,
//           completedInterviews: completed.length,
//           averageScore: Math.round(avgScore),
//           successRate: Math.round(successRate),
//         });

//         setRecentInterviews(completed.slice(0, 5));
//       } catch (error) {
//         console.error('Failed to fetch data:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const statCards = [
//     { title: 'Total Candidates', value: stats.totalCandidates, icon: Users, color: 'text-info' },
//     { title: 'Completed Interviews', value: stats.completedInterviews, icon: CheckCircle, color: 'text-success' },
//     { title: 'Average Score', value: `${stats.averageScore}%`, icon: TrendingUp, color: 'text-accent' },
//     { title: 'Success Rate', value: `${stats.successRate}%`, icon: Award, color: 'text-warning' },
//   ];

//   const getGrade = (score: number) => {
//     if (score >= 85) return { grade: 'A', color: 'bg-success text-success-foreground' };
//     if (score >= 70) return { grade: 'B', color: 'bg-info text-info-foreground' };
//     if (score >= 55) return { grade: 'C', color: 'bg-warning text-warning-foreground' };
//     return { grade: 'D', color: 'bg-destructive text-destructive-foreground' };
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
//         <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
//         <p className="text-muted-foreground mt-1">Overview of your interview assessments</p>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {statCards.map((stat) => (
//           <Card key={stat.title} className="border-border shadow-md hover:shadow-lg transition-shadow">
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//               <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
//               <stat.icon className={`h-5 w-5 ${stat.color}`} />
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold text-foreground">{stat.value}</div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       <Card className="border-border shadow-lg">
//         <CardHeader>
//           <CardTitle className="text-xl font-bold text-foreground">Recent Interviews</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {recentInterviews.length === 0 ? (
//             <div className="text-center py-12">
//               <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//               <p className="text-muted-foreground">No completed interviews yet</p>
//               <Link to="/create-candidate">
//                 <Button className="mt-4 bg-accent hover:bg-accent-dark text-accent-foreground">
//                   Start First Interview
//                 </Button>
//               </Link>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-border">
//                     <th className="text-left py-3 px-4 font-semibold text-foreground">Candidate</th>
//                     <th className="text-left py-3 px-4 font-semibold text-foreground">Position</th>
//                     <th className="text-left py-3 px-4 font-semibold text-foreground">Score</th>
//                     <th className="text-left py-3 px-4 font-semibold text-foreground">Grade</th>
//                     <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
//                     <th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {recentInterviews.map((interview: any) => {
//                     const { grade, color } = getGrade(interview.assessment?.overall_score || 0);
//                     return (
//                       <tr key={interview.id} className="border-b border-border hover:bg-secondary transition-colors">
//                         <td className="py-3 px-4 text-foreground">{interview.name}</td>
//                         <td className="py-3 px-4 text-foreground">{interview.position}</td>
//                         <td className="py-3 px-4 text-foreground font-semibold">{interview.assessment?.overall_score}%</td>
//                         <td className="py-3 px-4">
//                           <span className={`px-2 py-1 rounded-md font-bold text-sm ${color}`}>{grade}</span>
//                         </td>
//                         <td className="py-3 px-4 text-muted-foreground">
//                           {new Date(interview.created_at).toLocaleDateString()}
//                         </td>
//                         <td className="py-3 px-4">
//                           <Link to={`/results/${interview.id}`}>
//                             <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground">
//                               View
//                             </Button>
//                           </Link>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Home;
