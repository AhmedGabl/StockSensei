import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RinggPracticeCallProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: string;
}

declare global {
  interface Window {
    ringgData?: {
      callId: string;
      duration: number;
      transcript: string;
      audioUrl: string;
      metrics: any;
    };
  }
}

export function RinggPracticeCall({ isOpen, onClose, scenario }: RinggPracticeCallProps) {
  const [callStarted, setCallStarted] = useState(false);
  const [callCompleted, setCallCompleted] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const { toast } = useToast();

  const startPracticeCall = async () => {
    try {
      const response = await apiRequest("POST", "/api/practice-calls/start", { scenario });
      const data = await response.json();
      
      if (data.practiceCall) {
        setCurrentCallId(data.practiceCall.id);
        setCallStarted(true);
        
        // Initialize Ringg AI call if API key is available
        const ringgAgentId = import.meta.env.VITE_RINGG_AGENT_ID;
        const ringgApiKey = import.meta.env.VITE_RINGG_X_API_KEY;
        
        if (ringgAgentId && ringgApiKey) {
          initializeRinggCall(ringgAgentId, ringgApiKey);
        } else {
          // Simulate call for demonstration without API key
          simulatePracticeCall();
        }
        
        toast({
          title: "Practice call started",
          description: "Your roleplay session has begun. Speak naturally!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start practice call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initializeRinggCall = async (agentId: string, apiKey: string) => {
    try {
      // In a real implementation, this would integrate with Ringg AI API
      // For now, we'll simulate the call experience
      simulatePracticeCall();
    } catch (error) {
      console.error("Ringg AI integration error:", error);
      simulatePracticeCall();
    }
  };

  const simulatePracticeCall = () => {
    // Simulate call duration tracking
    let duration = 0;
    const interval = setInterval(() => {
      duration += 1;
      setCallDuration(duration);
    }, 1000);

    // Simulate call completion after 2 minutes for demo
    setTimeout(() => {
      clearInterval(interval);
      
      // Mock Ringg AI data for testing
      window.ringgData = {
        callId: `ringg-${Date.now()}`,
        duration: duration,
        transcript: generateMockTranscript(scenario),
        audioUrl: `https://mock-audio-url.com/call-${Date.now()}`,
        metrics: {
          speakingTime: duration * 0.6,
          silenceDuration: duration * 0.4,
          wordsPerMinute: 150,
          sentimentScore: 0.8
        }
      };
      
      setCallCompleted(true);
    }, 120000); // 2 minutes for demo
  };

  const generateMockTranscript = (scenario: string): string => {
    const scenarios: Record<string, string> = {
      "Low Class Consumption": `Hello, I'm calling about my son Ahmed's English classes. I'm concerned that he's only taking 10 classes this month, and I don't understand why he needs a fixed schedule.

CM: Thank you for calling. I understand your concerns about Ahmed's class consumption. Let me explain our 12-class policy and how it benefits students like Ahmed.

Parent: But I paid for the classes, why can't he take them whenever he wants?

CM: I completely understand your perspective. The 12-class consumption requirement is based on the Ebbinghaus Forgetting Curve research. When students have gaps longer than 2-3 days between classes, they can lose up to 70% of what they learned.

Parent: That's interesting, but my son is busy with school.

CM: I hear you about his school schedule. What if we set up a semi-fixed schedule? We could have the same teacher for consistency but allow some flexibility with timing. This way Ahmed gets the learning benefits while accommodating his school needs.

Parent: That sounds more reasonable. How does that work?

CM: Perfect! I can help you set up a schedule where Ahmed has classes every other day with Teacher Lisa, but we can adjust the times within a 2-hour window. This maintains learning momentum while giving you flexibility.`,
      
      "4th Call Scenario": `Hello, this is the fourth time I'm calling this month. My daughter still seems to be struggling with her English.

CM: Thank you for your patience in working with us. I can see this is your fourth call, and I really appreciate your dedication to your daughter's progress. Let me pull up her learning history.

Parent: I just don't see the improvement I was hoping for.

CM: I understand your concern. Learning a language takes time, and progress isn't always immediately visible. Let me show you some specific improvements I can see in her records.

Parent: What kind of improvements?

CM: Looking at her teacher's notes, I can see her vocabulary has increased by 47 new words this month, and her pronunciation confidence has improved significantly. Her teacher notes she's now initiating conversations in class rather than just responding.

Parent: I hadn't noticed that at home.

CM: That's actually normal. Children often demonstrate skills in the learning environment first. What I'd like to suggest is a progress review session where we can show you exactly what she's learned and provide some activities you can do at home to reinforce her learning.

Parent: That would be helpful.

CM: Excellent! I'll schedule a progress review with her teacher for next week, and I'll also send you a detailed progress report showing her achievements and next learning goals.`
    };

    return scenarios[scenario] || scenarios["Low Class Consumption"];
  };

  const completePracticeCall = async () => {
    if (!currentCallId) return;

    try {
      const response = await apiRequest("POST", "/api/practice-calls/complete", {
        id: currentCallId,
        outcome: "COMPLETED",
        notes: `Completed roleplay practice: ${scenario}`,
        scenario,
        ringgCallId: window.ringgData?.callId // Pass Ringg call ID to fetch real transcript
      });

      if (response.ok) {
        toast({
          title: "Practice call completed",
          description: "Your call has been analyzed with detailed AI feedback!",
        });
        
        setCallStarted(false);
        setCallCompleted(false);
        setCurrentCallId(null);
        setCallDuration(0);
        onClose();
        
        // Refresh the page to show the new call in history
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete practice call.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-headset text-white"></i>
            </div>
            <div>
              <span>Voice Practice Session</span>
              <p className="text-sm font-normal text-slate-500">{scenario}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Call Status */}
          {!callStarted && !callCompleted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Ready to Practice?</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                  <i className="fas fa-microphone text-white text-3xl"></i>
                </div>
                
                <div className="space-y-2">
                  <p className="text-slate-600">
                    You'll practice the <strong>{scenario}</strong> scenario with our AI trainer.
                  </p>
                  <p className="text-sm text-slate-500">
                    Speak naturally and apply your CM training. The session will be recorded and analyzed for feedback.
                  </p>
                </div>
                
                <Button 
                  onClick={startPracticeCall}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  <i className="fas fa-play mr-2"></i>
                  Start Voice Practice
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Active Call */}
          {callStarted && !callCompleted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-green-700">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Practice Session Active</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="text-4xl font-bold text-green-600">
                  {formatTime(callDuration)}
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">You're doing great!</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
                    <div className="text-left">
                      <p><strong>Remember to:</strong></p>
                      <ul className="space-y-1 mt-2">
                        <li>• Listen actively</li>
                        <li>• Show empathy</li>
                        <li>• Reference 51Talk policies</li>
                      </ul>
                    </div>
                    <div className="text-left">
                      <p><strong>Use data points:</strong></p>
                      <ul className="space-y-1 mt-2">
                        <li>• CEFR levels</li>
                        <li>• Learning progression</li>
                        <li>• Teacher qualifications</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-x-4">
                  <Button variant="outline" disabled>
                    <i className="fas fa-pause mr-2"></i>
                    Session in Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call Completed */}
          {callCompleted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-blue-700">
                  Practice Session Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <i className="fas fa-check text-blue-600 text-xl"></i>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium">Well done!</p>
                  <p className="text-slate-600">
                    Your session lasted <strong>{formatTime(callDuration)}</strong> and has been recorded for analysis.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="font-medium text-slate-700">Session Duration</p>
                    <p className="text-slate-600">{formatTime(callDuration)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="font-medium text-slate-700">Analysis Status</p>
                    <Badge variant="default">
                      <i className="fas fa-robot mr-1"></i>
                      AI Processing
                    </Badge>
                  </div>
                </div>

                <Button 
                  onClick={completePracticeCall}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <i className="fas fa-save mr-2"></i>
                  Complete & View Feedback
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <i className="fas fa-shield-alt mr-1"></i>
            Secure Practice Environment
          </Badge>
          <Button variant="outline" onClick={onClose} disabled={callStarted && !callCompleted}>
            {callStarted && !callCompleted ? "Session Active" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}