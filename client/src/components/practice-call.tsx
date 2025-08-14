import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PracticeCallProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: string;
}

export function PracticeCall({ isOpen, onClose, scenario }: PracticeCallProps) {
  const [callStarted, setCallStarted] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const { toast } = useToast();

  const startCall = async () => {
    try {
      const response = await apiRequest("POST", "/api/practice-calls/start", { scenario });
      const data = await response.json();
      setCurrentCallId(data.practiceCall.id);
      setCallStarted(true);

      // Try to initialize Ringg AI, but don't fail if it's not available
      try {
        initializeRinggAI();
      } catch (error) {
        console.warn("Ringg AI not available, using demo mode:", error);
      }
      
      toast({
        title: "Practice call started",
        description: "Your AI roleplay session is now active.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start practice call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const endCall = async (outcome: "PASSED" | "IMPROVE" | "N/A", notes?: string) => {
    if (!currentCallId) return;

    try {
      await apiRequest("POST", "/api/practice-calls/complete", {
        id: currentCallId,
        outcome,
        notes,
        scenario
      });

      // Trigger Botpress event
      if (window.botpressWebChat) {
        window.botpressWebChat.sendPayload({
          type: 'trigger',
          payload: { action: 'finished_practice' }
        });
      }

      toast({
        title: "Practice call completed",
        description: "Your performance has been recorded.",
      });

      setCallStarted(false);
      setCurrentCallId(null);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete practice call.",
        variant: "destructive",
      });
    }
  };

  const initializeRinggAI = () => {
    try {
      // Check if Ringg AI is already loaded
      if (window.loadAgent) {
        try {
          window.loadAgent({
            agentId: import.meta.env.VITE_RINGG_AGENT_ID || "373dc1f5-d841-4dc2-8b06-193e5177e0ba",
            xApiKey: import.meta.env.VITE_RINGG_X_API_KEY || "be40b1db-451c-4ede-9acd-2c4403f51ef0",
            variables: {
              callee_name: "CALLEE_NAME",
              mode: "MODE",
              scenario_id: scenario
            }
          });
          return;
        } catch (error) {
          console.error("Error calling loadAgent:", error);
          showFallbackInterface();
          return;
        }
      }

      // Load Ringg AI CDN
      const loadAgentsCdn = (version: string, callback: () => void) => {
        try {
          // Load CSS
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.type = "text/css";
          link.href = `https://cdn.jsdelivr.net/npm/@desivocal/agents-cdn@${version}/dist/style.css`;
          document.head.appendChild(link);

          // Load JS
          const script = document.createElement("script");
          script.type = "text/javascript";
          script.src = `https://cdn.jsdelivr.net/npm/@desivocal/agents-cdn@${version}/dist/dv-agent.es.js`;
          script.onload = callback;
          script.onerror = () => {
            console.error("Failed to load Ringg AI script");
            showFallbackInterface();
          };
          document.head.appendChild(script);
        } catch (error) {
          console.error("Error loading Ringg AI CDN:", error);
          showFallbackInterface();
        }
      };

      loadAgentsCdn("1.0.3", () => {
        try {
          if (window.loadAgent) {
            window.loadAgent({
              agentId: import.meta.env.VITE_RINGG_AGENT_ID || "373dc1f5-d841-4dc2-8b06-193e5177e0ba",
              xApiKey: import.meta.env.VITE_RINGG_X_API_KEY || "be40b1db-451c-4ede-9acd-2c4403f51ef0",
              variables: {
                callee_name: "CALLEE_NAME",
                mode: "MODE", 
                scenario_id: scenario
              }
            });
          } else {
            console.error("Ringg AI loadAgent function not available");
            showFallbackInterface();
          }
        } catch (error) {
          console.error("Error initializing Ringg AI:", error);
          showFallbackInterface();
        }
      });
    } catch (error) {
      console.error("Error in initializeRinggAI:", error);
      showFallbackInterface();
    }
  };

  const showFallbackInterface = () => {
    toast({
      title: "Practice Call Demo",
      description: "Voice practice system is in demo mode. This simulates a real practice call.",
      variant: "default",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Practice Call Session</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-6">
          {!callStarted ? (
            <div className="bg-slate-100 rounded-lg h-full flex items-center justify-center">
              <div className="text-center">
                <i className="fas fa-phone-alt text-6xl text-primary mb-4"></i>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Practice Call Ready</h3>
                <p className="text-slate-500 mb-6">
                  Scenario: {scenario}
                  <br />
                  This will launch an AI-powered roleplay session
                </p>
                <Button onClick={startCall} className="bg-emerald-500 hover:bg-emerald-600">
                  <i className="fas fa-play mr-2"></i>
                  Start Practice Call
                </Button>
                <p className="text-xs text-slate-400 mt-2">
                  Powered by Ringg AI Voice Assistant
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 rounded-lg h-full flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <i className="fas fa-microphone text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">AI Practice Session Active</h3>
                <p className="text-slate-500 mb-4">
                  Your roleplay call is in progress. The AI will simulate real scenarios.
                </p>
                <div className="bg-white rounded-lg p-4 mb-6 max-w-md">
                  <p className="text-sm text-slate-600">
                    <strong>Scenario:</strong> {scenario}
                    <br />
                    <strong>Instructions:</strong> Respond naturally as you would in a real call situation.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  onClick={() => endCall("PASSED", "Excellent communication and approach")}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <i className="fas fa-check mr-2"></i>
                  Completed Successfully
                </Button>
                <Button 
                  onClick={() => endCall("IMPROVE", "Good attempt, could improve")}
                  variant="outline"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Needs More Practice
                </Button>
                <Button 
                  onClick={() => endCall("N/A", "Session ended early")}
                  variant="destructive"
                >
                  <i className="fas fa-times mr-2"></i>
                  End Session
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Extend window type for Ringg AI
declare global {
  interface Window {
    botpressWebChat?: {
      sendPayload: (payload: any) => void;
    };
    loadAgent?: (config: any) => void;
  }
}
