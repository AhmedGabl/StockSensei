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

      // Initialize Ringg AI
      initializeRinggAI();
      
      toast({
        title: "Practice call started",
        description: "Your roleplay session is now active.",
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
    // Ringg AI integration
    const script = document.createElement('script');
    script.innerHTML = `
      function loadAgentsCdn(e,t){let n=document.createElement("link");n.rel="stylesheet",n.type="text/css",n.href=\`https://cdn.jsdelivr.net/npm/@desivocal/agents-cdn@\${e}/dist/style.css\`;var a=document.createElement("script");a.type="text/javascript",a.readyState?a.onreadystatechange=function(){"loaded"!==a.readyState&&"complete"!==a.readyState||(a.onreadystatechange=null,t())}:a.onload=function(){t()},a.src=\`https://cdn.jsdelivr.net/npm/@desivocal/agents-cdn@\${e}/dist/dv-agent.es.js\`,document.getElementsByTagName("head")[0].appendChild(n),document.getElementsByTagName("head")[0].appendChild(a)}
      
      loadAgentsCdn("1.0.3", function () {
        loadAgent({
          agentId: "${import.meta.env.VITE_RINGG_AGENT_ID || "373dc1f5-d841-4dc2-8b06-193e5177e0ba"}",
          xApiKey: "${import.meta.env.VITE_RINGG_X_API_KEY || "be40b1db-451c-4ede-9acd-2c4403f51ef0"}",
          variables: {"callee_name":"CALLEE_NAME"}
        });
      });
    `;
    document.head.appendChild(script);
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
                  Click to start your roleplay session
                </p>
                <Button onClick={startCall} className="bg-emerald-500 hover:bg-emerald-600">
                  <i className="fas fa-play mr-2"></i>
                  Start Call
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 rounded-lg h-full flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <i className="fas fa-phone text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Call in Progress</h3>
                <p className="text-slate-500">Practice session is active</p>
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  onClick={() => endCall("PASSED", "Great performance!")}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <i className="fas fa-check mr-2"></i>
                  Passed
                </Button>
                <Button 
                  onClick={() => endCall("IMPROVE", "Needs improvement")}
                  variant="outline"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Needs Work
                </Button>
                <Button 
                  onClick={() => endCall("N/A", "Session ended early")}
                  variant="destructive"
                >
                  <i className="fas fa-times mr-2"></i>
                  End Call
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
