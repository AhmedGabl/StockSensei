import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PhoneCall, Download, Play, FileText, RotateCcw, RefreshCw, Users, Clock, DollarSign, ArrowLeft, Home, Brain, Star, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface PracticeCall {
  id: string;
  userId: string;
  scenario: string;
  startedAt: string;
  endedAt?: string;
  outcome?: string;
  notes?: string;
  ringgCallId?: string;
  ringgAgentId?: string;
  transcript?: string;
  audioRecordingUrl?: string;
  callType?: string;
  callCost?: string;
  participantName?: string;
  callDuration?: string;
  callStatus?: string;
  // AI Evaluation fields
  aiEvaluationScore?: number;
  toneOfVoiceScore?: number;
  buildingRapportScore?: number;
  showingEmpathyScore?: number;
  handlingSkillsScore?: number;
  knowledgeScore?: number;
  aiEvaluationFeedback?: string;
  evaluatedAt?: string;
  user: {
    name: string;
    email: string;
  };
}

interface CallTrackingProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function CallTracking({ user, onNavigate, onLogout }: CallTrackingProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] = useState<PracticeCall | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Manual recording poll test
  const testRecordingPollMutation = useMutation({
    mutationFn: async (ringgCallId: string) => {
      const response = await fetch(`/api/practice-calls/poll-recording/${ringgCallId}`, {
        method: "GET",
      });
      if (!response.ok) throw new Error("Failed to poll for recording");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Recording Poll Test",
        description: `Call ${data.ringgCallId}: Transcript ${data.hasTranscript ? '✓' : '✗'}, Recording ${data.hasRecording ? '✓' : '✗'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Poll Test Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Fetch all practice calls
  const { data: callsData, isLoading: callsLoading } = useQuery({
    queryKey: ["/api/admin/practice-calls"],
  });

  // Test Ringg AI connection
  const { data: connectionData, isLoading: connectionLoading } = useQuery({
    queryKey: ["/api/admin/ringg-test"],
  });

  // Sync call history mutation
  const syncHistoryMutation = useMutation({
    mutationFn: async (params: { startDate?: string; endDate?: string; agentId?: string }) => {
      const response = await fetch("/api/admin/practice-calls/sync-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error("Failed to sync call history");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete", 
        description: `${data.message}. Found ${data.totalCalls} total calls with recordings.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/practice-calls"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calls: PracticeCall[] = (callsData as any)?.calls || [];

  // Calculate statistics
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((sum, call) => {
    const duration = typeof call.callDuration === 'string' ? parseFloat(call.callDuration) : call.callDuration || 0;
    return sum + duration;
  }, 0);
  const totalCost = calls.reduce((sum, call) => sum + parseFloat(call.callCost || "0"), 0);
  const uniqueUsers = new Set(calls.map(call => call.userId)).size;

  const handleSyncHistory = () => {
    syncHistoryMutation.mutate({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      agentId: selectedAgentId || undefined,
    });
  };

  // Evaluate single call
  const evaluateCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      const response = await fetch(`/api/practice-calls/${callId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to evaluate call");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Evaluation Complete",
        description: `Call evaluated with score: ${data.evaluation.overallScore}%`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/practice-calls"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Evaluation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Batch evaluate calls with transcripts
  const batchEvaluateMutation = useMutation({
    mutationFn: async () => {
      const callsWithTranscripts = calls.filter(call => 
        call.transcript && call.transcript.trim() && !call.aiEvaluationScore
      );
      
      if (callsWithTranscripts.length === 0) {
        throw new Error("No unevaluated calls with transcripts found");
      }

      const callIds = callsWithTranscripts.map(call => call.id);
      const response = await fetch("/api/admin/practice-calls/batch-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callIds }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to batch evaluate calls");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Batch Evaluation Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/practice-calls"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Batch Evaluation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatDuration = (duration: string | number) => {
    const seconds = typeof duration === 'string' ? parseFloat(duration) : duration;
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOutcomeBadgeColor = (outcome?: string) => {
    switch (outcome?.toUpperCase()) {
      case 'PASSED': return 'bg-green-100 text-green-800';
      case 'IMPROVE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("dashboard")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <div className="h-8 w-px bg-gray-300" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Call Tracking Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor and manage all practice calls with Ringg AI integration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={(connectionData as any)?.connected ? "default" : "destructive"}>
            {connectionLoading ? "Testing..." : (connectionData as any)?.connected ? "Ringg AI Connected" : "Connection Failed"}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <PhoneCall className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{totalCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Duration</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(totalDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Sync with Ringg AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="agent-id">Agent ID (Optional)</Label>
              <Input
                id="agent-id"
                placeholder="Enter agent ID"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSyncHistory}
                disabled={syncHistoryMutation.isPending}
                className="w-full"
              >
                {syncHistoryMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Sync Call History
              </Button>
            </div>
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Recording Poll System:</strong> Automatically captures recordings and transcripts when voice calls complete (may take 2-5 minutes).
                </p>
              </div>
              <Button
                onClick={() => batchEvaluateMutation.mutate()}
                disabled={batchEvaluateMutation.isPending || calls.filter(call => call.transcript && !call.aiEvaluationScore).length === 0}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {batchEvaluateMutation.isPending ? (
                  <>
                    <Brain className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    AI Evaluate All ({calls.filter(call => call.transcript && !call.aiEvaluationScore).length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
        </CardHeader>
        <CardContent>
          {callsLoading ? (
            <div className="text-center py-8">Loading calls...</div>
          ) : calls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No calls found. Try syncing with Ringg AI to fetch call history.
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Audio recordings are only available from live Ringg AI practice calls. 
                  Sample data shows transcripts but requires actual voice calls to generate recordings.
                </p>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Scenario</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Duration</th>
                    <th className="text-left p-3">AI Score</th>
                    <th className="text-left p-3">Cost</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={call.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{call.user.name || call.participantName}</div>
                          <div className="text-sm text-gray-500">{call.user.email}</div>
                        </div>
                      </td>
                      <td className="p-3">{call.scenario}</td>
                      <td className="p-3">
                        {format(new Date(call.startedAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="p-3">
                        {call.callDuration ? formatDuration(call.callDuration) : '-'}
                      </td>
                      <td className="p-3">
                        {call.aiEvaluationScore ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                                <Badge 
                                  className={
                                    call.aiEvaluationScore >= 80 ? 'bg-green-100 text-green-800' :
                                    call.aiEvaluationScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }
                                >
                                  {call.aiEvaluationScore}%
                                </Badge>
                                <CheckCircle2 className="h-4 w-4 text-green-600" title="View AI Evaluation Details" />
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Brain className="h-5 w-5" />
                                  AI Call Evaluation - {call.scenario}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <p><strong>User:</strong> {call.user.name || call.participantName}</p>
                                    <p><strong>Date:</strong> {format(new Date(call.startedAt), 'MMM dd, yyyy HH:mm')}</p>
                                    <p><strong>Duration:</strong> {call.callDuration ? formatDuration(call.callDuration) : 'Unknown'}</p>
                                    <p><strong>Analysis Type:</strong> {call.audioRecordingUrl ? 'AI + Audio Analysis' : 'Transcript Only'}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-3xl font-bold text-gray-900">
                                      {call.aiEvaluationScore}%
                                    </div>
                                    <p className="text-sm text-gray-600">Overall Score</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-gray-900">Performance Breakdown</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                      { name: 'Tone of Voice', score: call.toneOfVoiceScore, weight: '20%' },
                                      { name: 'Building Rapport', score: call.buildingRapportScore, weight: '20%' },
                                      { name: 'Showing Empathy', score: call.showingEmpathyScore, weight: '20%' },
                                      { name: 'Handling Skills', score: call.handlingSkillsScore, weight: '20%' },
                                      { name: 'Knowledge', score: call.knowledgeScore, weight: '20%' }
                                    ].map((criterion) => (
                                      <div key={criterion.name} className="border rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="font-medium text-sm">{criterion.name}</span>
                                          <span className="text-xs text-gray-500">{criterion.weight}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className={`h-2 rounded-full ${
                                                (criterion.score || 0) >= 80 ? 'bg-green-500' :
                                                (criterion.score || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                              }`}
                                              style={{ width: `${criterion.score || 0}%` }}
                                            />
                                          </div>
                                          <span className="text-sm font-semibold">{criterion.score || 0}%</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {call.aiEvaluationFeedback && (
                                  <div className="space-y-2">
                                    <h3 className="font-semibold text-gray-900">AI Feedback</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {call.aiEvaluationFeedback}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {call.evaluatedAt && (
                                  <div className="text-xs text-gray-500 border-t pt-2">
                                    Evaluated on {format(new Date(call.evaluatedAt), 'MMM dd, yyyy HH:mm')}
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : call.transcript ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => evaluateCallMutation.mutate(call.id)}
                            disabled={evaluateCallMutation.isPending}
                            className="text-xs"
                            title={call.audioRecordingUrl ? "Evaluate with audio analysis (enhanced tone scoring)" : "Evaluate transcript only"}
                          >
                            {evaluateCallMutation.isPending ? (
                              <Brain className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Brain className="h-3 w-3 mr-1" />
                                {call.audioRecordingUrl ? "AI + Audio" : "AI Eval"}
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-gray-400">No transcript</span>
                        )}
                      </td>
                      <td className="p-3">
                        {call.callCost ? `$${parseFloat(call.callCost).toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {call.audioRecordingUrl ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(call.audioRecordingUrl, '_blank')}
                              title="Play audio recording"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              title="Audio recording not available - recordings come from live Ringg AI calls"
                            >
                              <Play className="h-3 w-3 opacity-50" />
                            </Button>
                          )}
                          {call.transcript ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Open transcript in a modal or new window
                                const newWindow = window.open('', '_blank');
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head><title>Call Transcript</title></head>
                                      <body style="font-family: Arial, sans-serif; padding: 20px;">
                                        <h2>Call Transcript - ${call.scenario}</h2>
                                        <p><strong>Date:</strong> ${format(new Date(call.startedAt), 'MMM dd, yyyy HH:mm')}</p>
                                        <p><strong>User:</strong> ${call.user.name || call.participantName}</p>
                                        <hr />
                                        <pre style="white-space: pre-wrap;">${call.transcript}</pre>
                                      </body>
                                    </html>
                                  `);
                                }
                              }}
                              title="View call transcript"
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              title="Transcript not available"
                            >
                              <FileText className="h-3 w-3 opacity-50" />
                            </Button>
                          )}
                          {call.ringgCallId && !call.ringgCallId.startsWith('ringg_') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testRecordingPollMutation.mutate(call.ringgCallId!)}
                              disabled={testRecordingPollMutation.isPending}
                              title="Test recording poll status"
                            >
                              {testRecordingPollMutation.isPending ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}