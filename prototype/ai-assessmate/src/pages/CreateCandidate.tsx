import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { createCandidate } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const CreateCandidate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    phone: "",
  });

  // Handle navigation state for auto-starting interview
  useEffect(() => {
    const state = location.state || {};
    if (state.from === 'dashboard' && state.questions) {
      // Store interview data for auto-start after candidate creation
      setInterviewData({
        role: state.role,
        questions: state.questions,
        questionCount: state.questionCount,
        difficulty: state.difficulty,
        sequencing: state.sequencing
      });
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.position) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      const response = await createCandidate(formDataToSend);

      toast({
        title: "Success",
        description: "Candidate created successfully.",
      });

      const candidateId = response?.data?.candidate_id;
      
      // Check if we need to auto-start interview
      if (interviewData && candidateId) {
        // Auto-start live interview after candidate creation
        navigate("/live-interview-v2", {
          state: {
            candidateId: candidateId,
            candidateName: formData.name,
            candidateEmail: formData.email,
            role: interviewData.role,
            questions: interviewData.questions
          }
        });
      } else if (candidateId) {
        // Normal flow - go to recorded interview
        navigate(`/record/${candidateId}`);
      } else {
        // Fallback
        navigate("/candidates");
      }
    } catch (error) {
      console.error("Failed to create candidate:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.detail ||
          "Failed to create candidate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* ✅ Header */}
      <motion.div
        className="mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold text-foreground">
          Create New Candidate
        </h1>
        <p className="text-muted-foreground mt-1">
          Add a new candidate to start the interview process
        </p>
      </motion.div>

      {/* ✅ Animated Form Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
      >
        <Card className="border-border shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <UserPlus className="h-5 w-5 text-accent" />
              <span>Candidate Information</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[
                {
                  id: "name",
                  label: "Full Name",
                  required: true,
                  placeholder: "John Doe",
                  type: "text",
                },
                {
                  id: "email",
                  label: "Email Address",
                  required: true,
                  placeholder: "john.doe@example.com",
                  type: "email",
                },
                {
                  id: "position",
                  label: "Position",
                  required: true,
                  placeholder: "Senior Software Engineer",
                  type: "text",
                },
                {
                  id: "phone",
                  label: "Phone Number",
                  required: false,
                  placeholder: "+1 (555) 123-4567",
                  type: "tel",
                },
              ].map((field, index) => (
                <motion.div
                  key={field.id}
                  className="space-y-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 * index }}
                >
                  <Label htmlFor={field.id} className="text-foreground">
                    {field.label}{" "}
                    {field.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <Input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      value={formData[field.id]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="border-input focus:ring-primary transition-all duration-200"
                    />
                  </motion.div>
                </motion.div>
              ))}

              {/* ✅ Buttons */}
              <motion.div
                className="flex space-x-4 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-accent hover:bg-accent-dark text-accent-foreground font-semibold transition-all duration-300"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                      className="inline-block mr-2 border-2 border-t-transparent border-white rounded-full h-4 w-4"
                    />
                  ) : null}
                  {loading ? "Creating..." : "Create Candidate"}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => navigate("/candidates")}
                  className="flex-1 border border-border bg-background hover:bg-accent hover:text-accent-foreground text-foreground font-semibold transition-all duration-300"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
              </motion.div>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CreateCandidate;



// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { UserPlus } from 'lucide-react';
// import { createCandidate } from '@/services/api';
// import { toast } from '@/hooks/use-toast';

// const CreateCandidate = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     position: '',
//     phone: '',
//   });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!formData.name || !formData.email || !formData.position) {
//       toast({
//         title: 'Validation Error',
//         description: 'Please fill in all required fields',
//         variant: 'destructive',
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       await createCandidate(formData);
//       toast({
//         title: 'Success',
//         description: 'Candidate created successfully',
//       });
//       navigate('/candidates');
//     } catch (error) {
//       console.error('Failed to create candidate:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to create candidate. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-foreground">Create New Candidate</h1>
//         <p className="text-muted-foreground mt-1">Add a new candidate to start the interview process</p>
//       </div>

//       <Card className="border-border shadow-lg">
//         <CardHeader>
//           <CardTitle className="flex items-center space-x-2 text-foreground">
//             <UserPlus className="h-5 w-5 text-accent" />
//             <span>Candidate Information</span>
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="space-y-2">
//               <Label htmlFor="name" className="text-foreground">
//                 Full Name <span className="text-destructive">*</span>
//               </Label>
//               <Input
//                 id="name"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 placeholder="John Doe"
//                 required
//                 className="border-input focus:ring-primary"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="email" className="text-foreground">
//                 Email Address <span className="text-destructive">*</span>
//               </Label>
//               <Input
//                 id="email"
//                 name="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="john.doe@example.com"
//                 required
//                 className="border-input focus:ring-primary"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="position" className="text-foreground">
//                 Position <span className="text-destructive">*</span>
//               </Label>
//               <Input
//                 id="position"
//                 name="position"
//                 value={formData.position}
//                 onChange={handleChange}
//                 placeholder="Senior Software Engineer"
//                 required
//                 className="border-input focus:ring-primary"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="phone" className="text-foreground">
//                 Phone Number
//               </Label>
//               <Input
//                 id="phone"
//                 name="phone"
//                 type="tel"
//                 value={formData.phone}
//                 onChange={handleChange}
//                 placeholder="+1 (555) 123-4567"
//                 className="border-input focus:ring-primary"
//               />
//             </div>

//             <div className="flex space-x-4 pt-4">
//               <Button
//                 type="submit"
//                 disabled={loading}
//                 className="flex-1 bg-accent hover:bg-accent-dark text-accent-foreground font-semibold"
//               >
//                 {loading ? 'Creating...' : 'Create Candidate'}
//               </Button>
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => navigate('/candidates')}
//                 className="flex-1"
//               >
//                 Cancel
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default CreateCandidate;
