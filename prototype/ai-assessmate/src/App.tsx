import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import CreateCandidate from "./pages/CreateCandidate";
import CandidatesList from "./pages/CandidatesList";
import History from "./pages/History";
import RecordInterview from "./pages/RecordInterview";
import ViewResults from "./pages/ViewResults";
import NotFound from "./pages/NotFound";
import InterviewHistory from "./pages/InterviewHistory"; // ✅ added missing import
import CompareCandidates from "@/components/CompareCandidates";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex w-full">
            <Sidebar />
            <main className="flex-1 p-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create-candidate" element={<CreateCandidate />} />
                <Route path="/history" element={<History />} />
                <Route path="/interview/:id" element={<InterviewHistory />} /> {/* ✅ added missing route */}
                <Route path="/record/:candidateId" element={<RecordInterview />} />
                <Route path="/results/:interviewId" element={<ViewResults />} /> {/* ✅ fixed param name */}
                <Route path="/candidates" element={<CandidatesList />} />
                <Route path="/compare" element={<CompareCandidates />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;



// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Navbar from "./components/Navbar";
// import Sidebar from "./components/Sidebar";
// import Home from "./pages/Home";
// import CreateCandidate from "./pages/CreateCandidate";
// import CandidatesList from "./pages/CandidatesList";
// import History from "./pages/History";
// import RecordInterview from "./pages/RecordInterview";
// import ViewResults from "./pages/ViewResults";
// import NotFound from "./pages/NotFound";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <div className="min-h-screen bg-background">
//           <Navbar />
//           <div className="flex w-full">
//             <Sidebar />
//             <main className="flex-1 p-8">
//               <Routes>
//                 <Route path="/" element={<Home />} />
//                 <Route path="/create-candidate" element={<CreateCandidate />} />
//                 <Route path="/history" element={<History />} />

//                 <Route path="/record/:candidateId" element={<RecordInterview />} />
//                 <Route path="/results/:candidateId" element={<ViewResults />} />
//                 <Route path="/candidates" element={<CandidatesList />} />
//                 <Route path="*" element={<NotFound />} />
//               </Routes>
//             </main>
//           </div>
//         </div>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;
