import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Video, 
  TrendingUp, 
  Award,
  Calendar,
  Clock,
  BarChart3
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease";
  icon: React.ReactNode;
  description?: string;
}

const StatsCard = ({ title, value, change, changeType, icon, description }: StatsCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
  >
    <Card className="border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {changeType === "increase" ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <TrendingUp className="h-3 w-3 mr-1 text-red-500 rotate-180" />
            )}
            <span className={changeType === "increase" ? "text-green-500" : "text-red-500"}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">from last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

interface DashboardStatsProps {
  stats: {
    totalCandidates: number;
    completedInterviews: number;
    averageScore: number;
    successRate: number;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatsCard
        title="Total Candidates"
        value={stats.totalCandidates}
        change={12}
        changeType="increase"
        icon={<Users className="h-4 w-4 text-primary" />}
        description="Active candidates in system"
      />
      
      <StatsCard
        title="Completed Interviews"
        value={stats.completedInterviews}
        change={8}
        changeType="increase"
        icon={<Video className="h-4 w-4 text-primary" />}
        description="Interviews completed this month"
      />
      
      <StatsCard
        title="Average Score"
        value={`${stats.averageScore}%`}
        change={5}
        changeType="increase"
        icon={<BarChart3 className="h-4 w-4 text-primary" />}
        description="Across all interviews"
      />
      
      <StatsCard
        title="Success Rate"
        value={`${stats.successRate}%`}
        change={3}
        changeType="increase"
        icon={<Award className="h-4 w-4 text-primary" />}
        description="Candidates passed assessment"
      />
    </div>
  );
};

export default DashboardStats;
