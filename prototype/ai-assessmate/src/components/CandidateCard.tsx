import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreVertical,
  Mail,
  Phone,
  Briefcase,
  Play,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  Star,
} from "lucide-react";

interface CandidateCardProps {
  candidate: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    position: string;
    interview_count?: number;
    average_score?: number;
    status?: "active" | "completed" | "pending";
    last_interview?: string;
  };
  onLiveInterview?: (candidate: any) => void;
  onRecordedInterview?: (candidate: any) => void;
  onViewProfile?: (candidate: any) => void;
}

const CandidateCard = ({ 
  candidate, 
  onLiveInterview, 
  onRecordedInterview, 
  onViewProfile 
}: CandidateCardProps) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "active": return "Active";
      case "completed": return "Completed";
      case "pending": return "Pending";
      default: return "Unknown";
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="border-border shadow-xl hover:shadow-2xl transition-all duration-300 group bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            {/* Candidate Info */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-sm">
                <AvatarImage src={`/avatars/candidate-${candidate.id}.png`} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                  {candidate.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-foreground mb-2">
                  {candidate.name}
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate font-medium">
                    {candidate.position || "Position not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <Badge 
              className={`${getStatusColor(candidate.status)} border-0 px-3 py-1 shadow-sm`}
              variant="secondary"
            >
              {getStatusText(candidate.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {/* Contact Info */}
          <div className="flex flex-col space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 flex-shrink-0 text-blue-500" />
              <span className="truncate">{candidate.email}</span>
            </div>
            {candidate.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>{candidate.phone}</span>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {candidate.interview_count || 0}
              </div>
              <div className="text-xs text-muted-foreground">Interviews</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold flex items-center justify-center ${getScoreColor(candidate.average_score)}`}>
                {candidate.average_score || 0}%
                {getScoreIcon(candidate.average_score)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Score</div>
            </div>
          </div>

          {/* Last Interview */}
          {candidate.last_interview && (
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0 text-purple-500" />
              <span>Last interview: {candidate.last_interview}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Button
              onClick={() => onLiveInterview?.(candidate)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-300 h-11 shadow-md hover:shadow-lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Live Interview
            </Button>
            
            <Button
              onClick={() => onRecordedInterview?.(candidate)}
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 h-11 shadow-sm hover:shadow-md"
            >
              <Eye className="h-4 w-4 mr-2" />
              <span className="truncate">View Recorded</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CandidateCard;
