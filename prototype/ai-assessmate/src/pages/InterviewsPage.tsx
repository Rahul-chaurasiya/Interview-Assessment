import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  Calendar, 
  Filter,
  Search,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Play
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getAllInterviews } from "@/services/api";

// Helper function to format role and status names
const formatRoleName = (role) => {
  if (!role) return '';
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatStatusName = (status) => {
  if (!status) return '';
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const InterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // Load interviews on mount and filter change
  useEffect(() => {
    loadInterviews();
  }, [filters]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const response = await getAllInterviews(params.toString());
      setInterviews(response.data || []);
      
    } catch (error) {
      console.error("Failed to load interviews:", error);
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      search: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatRoleName = (role) => {
    if (!role) return '';
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && interviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#1A4D2E]" />
          <p className="mt-4 text-lg text-gray-600">Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              All Interviews
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all interview sessions
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Interviews</p>
            <p className="text-2xl font-bold text-[#1A4D2E]">{interviews.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by candidate name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Clear Filters */}
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interviews List */}
      <div className="space-y-4">
        {interviews.map((interview, index) => (
          <Card key={interview.id} className="border-border shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-lg text-foreground">
                        {interview.candidate_name}
                      </CardTitle>
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${getStatusColor(interview.status)}`}>
                        {getStatusIcon(interview.status)}
                        <span>{formatStatusName(interview.status)}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{formatRoleName(interview.role)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Play className="h-3 w-3" />
                        <span>{formatRoleName(interview.interview_type)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(interview.created_at).toLocaleDateString()}</span>
                      </span>
                      {interview.duration_minutes && (
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{interview.duration_minutes} min</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Score and Actions */}
                <div className="text-right">
                  {interview.score !== null && (
                    <div className="mb-2">
                      <p className="text-2xl font-bold text-[#1A4D2E]">{interview.score}%</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  )}
                  {interview.status === 'completed' && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {/* Additional Details */}
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-foreground mb-1">Contact</p>
                  <p className="text-muted-foreground">{interview.candidate_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Questions</p>
                  <p className="text-muted-foreground">{interview.questions_count} questions</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Completed</p>
                  <p className="text-muted-foreground">
                    {interview.completed_at 
                      ? new Date(interview.completed_at).toLocaleDateString()
                      : 'Not completed'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {interviews.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No interviews found matching your filters.</p>
          <Button
            onClick={clearFilters}
            variant="outline"
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default InterviewsPage;
