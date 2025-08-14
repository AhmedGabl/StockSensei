import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CallFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
}

interface CallEvaluation {
  id: string;
  overallScore: number;
  scores: Record<string, number>;
  feedback: string;
  criteria: string[];
  isAiGenerated: boolean;
  strengths: string[];
  improvements: string[];
  scenarioSpecificNotes?: string;
  evaluatedAt: string;
}

interface CallFeedbackData {
  call: {
    id: string;
    scenario: string;
    startedAt: string;
    endedAt?: string;
    duration?: number;
    transcript?: string;
    audioUrl?: string;
    outcome?: "PASSED" | "IMPROVE" | "N/A";
    notes?: string;
  };
  evaluations: CallEvaluation[];
  hasAudio: boolean;
  hasTranscript: boolean;
  duration: number;
}

export function CallFeedbackModal({ isOpen, onClose, callId }: CallFeedbackModalProps) {
  const [feedbackData, setFeedbackData] = useState<CallFeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && callId) {
      fetchCallFeedback();
    }
  }, [isOpen, callId]);

  const fetchCallFeedback = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("GET", `/api/practice-calls/${callId}/feedback`);
      const data = await response.json();
      setFeedbackData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load call feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getOverallBadgeVariant = (score: number) => {
    if (score >= 8) return "default";
    if (score >= 6) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading call feedback...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!feedbackData) return null;

  const { call, evaluations } = feedbackData;
  const aiEvaluation = evaluations.find(e => e.isAiGenerated);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-white"></i>
            </div>
            <div>
              <span>Practice Call Feedback</span>
              <p className="text-sm font-normal text-slate-500">
                {call.scenario} • {formatDuration(feedbackData.duration)}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="transcript" disabled={!feedbackData.hasTranscript}>
              Transcript
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {aiEvaluation && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overall Score */}
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">Overall Score</CardTitle>
                    <div className="text-4xl font-bold mt-4">
                      <span className={getScoreColor(aiEvaluation.overallScore)}>
                        {aiEvaluation.overallScore}
                      </span>
                      <span className="text-slate-400 text-xl">/10</span>
                    </div>
                    <Badge variant={getOverallBadgeVariant(aiEvaluation.overallScore)} className="mt-2">
                      {aiEvaluation.overallScore >= 8 ? "Excellent" : 
                       aiEvaluation.overallScore >= 6 ? "Good" : "Needs Improvement"}
                    </Badge>
                  </CardHeader>
                </Card>

                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <i className="fas fa-trophy text-green-500 mr-2"></i>
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiEvaluation.strengths.length > 0 ? (
                      <div className="space-y-2">
                        {aiEvaluation.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center">
                            <i className="fas fa-check text-green-500 mr-2"></i>
                            <span className="text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">Keep practicing to build strengths</p>
                    )}
                  </CardContent>
                </Card>

                {/* Areas for Improvement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <i className="fas fa-arrow-up text-blue-500 mr-2"></i>
                      Focus Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiEvaluation.improvements.length > 0 ? (
                      <div className="space-y-2">
                        {aiEvaluation.improvements.map((improvement, index) => (
                          <div key={index} className="flex items-center">
                            <i className="fas fa-arrow-right text-blue-500 mr-2"></i>
                            <span className="text-sm">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">Great job! No major areas to improve</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Performance Breakdown */}
            {aiEvaluation && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(aiEvaluation.scores).map(([criteria, score]) => (
                      <div key={criteria} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{criteria}</span>
                          <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                            {score}/10
                          </span>
                        </div>
                        <Progress value={score * 10} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Call Information */}
            <Card>
              <CardHeader>
                <CardTitle>Call Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Duration</p>
                    <p className="font-medium">{formatDuration(feedbackData.duration)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Outcome</p>
                    <Badge variant={call.outcome === "PASSED" ? "default" : "secondary"}>
                      {call.outcome || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-500">Audio Available</p>
                    <Badge variant={feedbackData.hasAudio ? "default" : "secondary"}>
                      {feedbackData.hasAudio ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-500">Transcript</p>
                    <Badge variant={feedbackData.hasTranscript ? "default" : "secondary"}>
                      {feedbackData.hasTranscript ? "Available" : "Not Available"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6 mt-6">
            {aiEvaluation && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>AI Analysis Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <div 
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: aiEvaluation.feedback.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') 
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {aiEvaluation.scenarioSpecificNotes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                        Scenario-Specific Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">{aiEvaluation.scenarioSpecificNotes}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {call.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{call.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transcript" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Call Transcript</span>
                  {feedbackData.hasAudio && (
                    <Button variant="outline" size="sm">
                      <i className="fas fa-play mr-2"></i>
                      Play Audio
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {call.transcript ? (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {call.transcript}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">
                    Transcript not available for this call
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <i className="fas fa-robot mr-1"></i>
              AI-Powered Analysis
            </Badge>
          </div>
          <div className="space-x-3">
            <Button variant="outline" onClick={() => fetchCallFeedback()}>
              <i className="fas fa-refresh mr-2"></i>
              Refresh
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}