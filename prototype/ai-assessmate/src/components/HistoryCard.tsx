import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, TrendingUp, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Assessment {
  overall_score?: number;
  grade?: string;
  success_probability?: number;
}

interface Interview {
  id: string | number;
  status: string;
}

interface HistoryCardProps {
  interview: Interview;
  assessment?: Assessment | null;
  logs?: any;
}

export default function HistoryCard({ interview, assessment }: HistoryCardProps) {
  const navigate = useNavigate();
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!assessment) return;
    let start = 0;
    const end = assessment.overall_score || 0;
    const step = end / 60;
    const interval = setInterval(() => {
      start += step;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(interval);
      } else {
        setAnimatedScore(start);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [assessment]);

  const getGradeColor = (grade?: string) => {
    if (!grade) return "text-muted-foreground";
    if (grade.startsWith("A")) return "text-success";
    if (grade.startsWith("B")) return "text-info";
    if (grade.startsWith("C")) return "text-warning";
    return "text-destructive";
  };

  const getGradeBorder = (grade?: string) => {
    if (!grade) return "border-l-muted";
    if (grade.startsWith("A")) return "border-l-success";
    if (grade.startsWith("B")) return "border-l-info";
    if (grade.startsWith("C")) return "border-l-warning";
    return "border-l-destructive";
  };

  const handleView = () => {
    navigate(`/view-results/${interview.id}`);
  };

  return (
    <Card
      className={`border-l-8 ${getGradeBorder(assessment?.grade)} hover:shadow-lg transition-shadow cursor-pointer`}
      onClick={handleView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-primary" />
            Interview #{interview.id}
          </CardTitle>
          <Badge variant="outline" className="border-primary text-primary">
            {interview.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {assessment ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-border bg-muted/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {animatedScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">/100</div>
                  </div>
                </div>
                <div className={`text-4xl font-bold ${getGradeColor(assessment.grade)}`}>
                  {assessment.grade}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
              <div className="flex items-start gap-2">
                <BarChart2 className="h-4 w-4 text-info mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-sm font-semibold text-foreground">
                    {assessment.success_probability?.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-success mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Overall Score</p>
                  <p className="text-sm font-semibold text-foreground">
                    {assessment.overall_score?.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No assessment data yet</p>
        )}
      </CardContent>
    </Card>
  );
}
