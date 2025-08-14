import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PracticeCall {
  id: string;
  scenario: string;
  startedAt: string;
  endedAt?: string;
  outcome?: "PASSED" | "IMPROVE" | "N/A";
  notes?: string;
  duration?: number;
  transcript?: string;
  audioUrl?: string;
}

interface PracticeCallHistoryProps {
  onViewFeedback: (callId: string) => void;
}

export function PracticeCallHistory({ onViewFeedback }: PracticeCallHistoryProps) {
  const { data: calls = [], isLoading } = useQuery<PracticeCall[]>({
    queryKey: ["/api/practice-calls"],
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOutcomeVariant = (outcome?: string) => {
    switch (outcome) {
      case "PASSED": return "default";
      case "IMPROVE": return "secondary";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-phone text-slate-400 text-xl"></i>
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-2">No practice calls yet</h3>
        <p className="text-slate-500 mb-4">Start your first roleplay session to see your progress here</p>
      </div>
    );
  }

  const recentCalls = calls.slice(0, 5);

  return (
    <div className="space-y-3">
      {recentCalls.map((call) => (
        <Card key={call.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-headset text-white text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">{call.scenario}</h4>
                    <p className="text-sm text-slate-500">{formatDate(call.startedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-slate-600">
                    <i className="fas fa-clock mr-1"></i>
                    {formatDuration(call.duration)}
                  </span>
                  
                  {call.outcome && (
                    <Badge variant={getOutcomeVariant(call.outcome)}>
                      {call.outcome}
                    </Badge>
                  )}
                  
                  {call.transcript && (
                    <span className="text-green-600">
                      <i className="fas fa-file-text mr-1"></i>
                      Transcript Available
                    </span>
                  )}
                  
                  {call.audioUrl && (
                    <span className="text-blue-600">
                      <i className="fas fa-volume-up mr-1"></i>
                      Audio Available
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewFeedback(call.id)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  data-testid={`button-feedback-${call.id}`}
                >
                  <i className="fas fa-chart-line mr-2"></i>
                  View Feedback
                </Button>
              </div>
            </div>
            
            {call.notes && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">{call.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {calls.length > 5 && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            View All {calls.length} Practice Sessions
          </Button>
        </div>
      )}
    </div>
  );
}