import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // 🎬 Added Framer Motion
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Mail,
  Phone,
  Briefcase,
  Play,
  Eye,
  Search,
} from "lucide-react";
import { getCandidatesList } from "@/services/api";

export default function CandidatesList() {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* ✅ Header Section */}
      <motion.div
        className="flex justify-between items-start"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Candidates</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all candidate profiles
          </p>
        </div>
        <Link to="/create-candidate">
          <Button className="bg-accent hover:bg-accent-dark text-accent-foreground font-semibold">
            Add New Candidate
          </Button>
        </Link>
      </motion.div>

      {/* ✅ Search Bar Animation */}
      <motion.div
        className="relative"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search candidates by name, email, or position..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-input focus:ring-primary"
        />
      </motion.div>

      {error && (
        <motion.div
          className="text-destructive text-center font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      {/* ✅ Candidate Cards or Empty State */}
      <AnimatePresence>
        {filteredCandidates.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-border shadow-lg">
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  No candidates found
                </p>
                {!searchTerm && (
                  <Link to="/create-candidate">
                    <Button className="mt-4 bg-accent hover:bg-accent-dark text-accent-foreground font-semibold">
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                whileHover={{
                  scale: 1.03,
                  transition: { type: "spring", stiffness: 200 },
                }}
              >
                <Card className="border-border shadow-md hover:shadow-xl transition-all">
                  <CardHeader className="bg-primary-light">
                    <CardTitle className="text-xl font-bold text-primary-foreground flex items-center space-x-2">
                      <Users className="h-5 w-5 text-accent" />
                      <span>{candidate.name}</span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center space-x-2 text-foreground">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {candidate.position || "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm truncate">{candidate.email}</span>
                    </div>

                    {candidate.phone && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{candidate.phone}</span>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-4">
                      <Link to={`/record/${candidate.id}`} className="flex-1">
                        <Button className="w-full bg-accent hover:bg-accent-dark text-accent-foreground font-semibold">
                          <Play className="h-4 w-4 mr-2" />
                          Start Interview
                        </Button>
                      </Link>

                      <Link to={`/results/${candidate.id}`}>
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-primary-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}




// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Users, Mail, Phone, Briefcase, Play, Eye, Search } from 'lucide-react';
// import { getCandidatesList } from '@/services/api';

// const CandidatesList = () => {
//   const [candidates, setCandidates] = useState([]);
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const response = await getCandidatesList();
//         setCandidates(response.data);
//         setFilteredCandidates(response.data);
//       } catch (error) {
//         console.error('Failed to fetch candidates:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, []);

//   useEffect(() => {
//     const filtered = candidates.filter((candidate: any) =>
//       candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//     setFilteredCandidates(filtered);
//   }, [searchTerm, candidates]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[50vh]">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       <div className="flex justify-between items-start">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">All Candidates</h1>
//           <p className="text-muted-foreground mt-1">Manage and view all candidate profiles</p>
//         </div>
//         <Link to="/create-candidate">
//           <Button className="bg-accent hover:bg-accent-dark text-accent-foreground font-semibold">
//             Add New Candidate
//           </Button>
//         </Link>
//       </div>

//       <div className="relative">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
//         <Input
//           type="text"
//           placeholder="Search candidates by name, email, or position..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="pl-10 border-input focus:ring-primary"
//         />
//       </div>

//       {filteredCandidates.length === 0 ? (
//         <Card className="border-border shadow-lg">
//           <CardContent className="text-center py-12">
//             <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
//             <p className="text-muted-foreground text-lg">No candidates found</p>
//             {searchTerm && (
//               <p className="text-muted-foreground mt-2">Try adjusting your search</p>
//             )}
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredCandidates.map((candidate: any) => (
//             <Card key={candidate.id} className="border-border shadow-md hover:shadow-xl transition-shadow">
//               <CardHeader className="bg-primary-light">
//                 <CardTitle className="text-xl font-bold text-primary-foreground flex items-center space-x-2">
//                   <Users className="h-5 w-5 text-accent" />
//                   <span>{candidate.name}</span>
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4 pt-6">
//                 <div className="flex items-center space-x-2 text-foreground">
//                   <Briefcase className="h-4 w-4 text-muted-foreground" />
//                   <span className="font-medium">{candidate.position}</span>
//                 </div>
//                 <div className="flex items-center space-x-2 text-muted-foreground">
//                   <Mail className="h-4 w-4" />
//                   <span className="text-sm truncate">{candidate.email}</span>
//                 </div>
//                 {candidate.phone && (
//                   <div className="flex items-center space-x-2 text-muted-foreground">
//                     <Phone className="h-4 w-4" />
//                     <span className="text-sm">{candidate.phone}</span>
//                   </div>
//                 )}
                
//                 <div className="flex space-x-2 pt-4">
//                   <Link to={`/record/${candidate.id}`} className="flex-1">
//                     <Button className="w-full bg-accent hover:bg-accent-dark text-accent-foreground font-semibold">
//                       <Play className="h-4 w-4 mr-2" />
//                       Start Interview
//                     </Button>
//                   </Link>
//                   <Link to={`/results/${candidate.id}`}>
//                     <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground">
//                       <Eye className="h-4 w-4" />
//                     </Button>
//                   </Link>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default CandidatesList;
