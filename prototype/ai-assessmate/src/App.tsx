import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopNav from "./components/TopNav";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import SelectRole from "./pages/SelectRole";
import CreateCandidate from "./pages/CreateCandidate";
import CandidatesList from "./pages/CandidatesList";
import History from "./pages/History";
import RecordInterview from "./pages/RecordInterview";
import ViewResults from "./pages/ViewResults";
import NotFound from "./pages/NotFound";
import LiveInterviewV2 from "./pages/LiveInterviewV2";
import LiveResults from "./pages/LiveResults";
import ShowQuestions from "./pages/ShowQuestions";
import QuestionBank from "./pages/QuestionBank";
import InterviewsPage from "./pages/InterviewsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <TopNav />
          <div className="flex bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-background">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/candidates" element={<CandidatesList />} />
                <Route path="/create-candidate" element={<CreateCandidate />} />
                <Route path="/select-role" element={<SelectRole />} />
                <Route path="/show-questions" element={<ShowQuestions />} />
                <Route path="/questions" element={<QuestionBank />} />
                <Route path="/interviews" element={<InterviewsPage />} />
                <Route path="/live-interview-v2" element={<LiveInterviewV2 />} />
                <Route path="/live-results/:sessionId" element={<LiveResults />} />
                <Route path="/record/:candidateId" element={<RecordInterview />} />
                <Route path="/view-results/:interviewId" element={<ViewResults />} />
                <Route path="/results/:interviewId" element={<ViewResults />} />
                <Route path="/history" element={<History />} />
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
