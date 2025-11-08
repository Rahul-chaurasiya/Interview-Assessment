import { BarChart3, Volume2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TranscriptionSegment {
  speaker: string;
  text: string;
  start_time: number;
  end_time: number;
}

interface TranscriptionSummary {
  total_segments?: number;
  interviewer_segments?: number;
  candidate_segments?: number;
  qa_pairs?: number;
}

interface TranscriptionData {
  transcription?: TranscriptionSegment[];
  transcription_summary?: TranscriptionSummary;
}

interface TranscriptionViewProps {
  transcription: TranscriptionData | null;
  loading: boolean;
}

export default function TranscriptionView({ transcription, loading }: TranscriptionViewProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading transcription...</p>
      </div>
    );
  }

  if (!transcription) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl">
            <BarChart3 className="h-8 w-8 text-primary" />
            Transcription Analysis
          </CardTitle>
          <p className="text-muted-foreground">Complete interview conversation breakdown</p>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Total Segments</p>
              <p className="text-3xl font-bold text-foreground">
                {transcription.transcription_summary?.total_segments || 0}
              </p>
              <p className="text-xs text-muted-foreground">speech turns</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-info/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Interviewer</p>
              <p className="text-3xl font-bold text-info">
                {transcription.transcription_summary?.interviewer_segments || 0}
              </p>
              <p className="text-xs text-muted-foreground">questions & guidance</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Candidate</p>
              <p className="text-3xl font-bold text-accent-dark">
                {transcription.transcription_summary?.candidate_segments || 0}
              </p>
              <p className="text-xs text-muted-foreground">responses</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Q&A Pairs</p>
              <p className="text-3xl font-bold text-success">
                {transcription.transcription_summary?.qa_pairs || 0}
              </p>
              <p className="text-xs text-muted-foreground">exchanges</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transcription Content */}
      <Card className="border-border shadow-md">
        <CardHeader>
          <CardTitle>Interview Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transcription.transcription?.map((segment, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-l-4 ${
                segment.speaker.toLowerCase() === "interviewer"
                  ? "bg-info/5 border-info"
                  : "bg-accent/5 border-accent"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge
                  className={
                    segment.speaker.toLowerCase() === "interviewer"
                      ? "bg-info text-info-foreground"
                      : "bg-accent text-accent-foreground"
                  }
                >
                  {segment.speaker.toLowerCase() === "interviewer" ? (
                    <Volume2 className="h-3 w-3 mr-1" />
                  ) : (
                    <User className="h-3 w-3 mr-1" />
                  )}
                  {segment.speaker.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                </span>
              </div>
              <p className="text-foreground">{segment.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
