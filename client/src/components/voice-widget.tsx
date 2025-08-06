import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface VoiceWidgetProps {
  onStartCall?: (scenario: string) => void;
  onShowBotpress?: () => void;
}

export function VoiceWidget({ onStartCall, onShowBotpress }: VoiceWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleVoiceCall = async () => {
    setIsLoading(true);
    
    try {
      // Try to initialize Ringg AI voice agent
      await initializeRinggVoiceAgent();
      
      toast({
        title: "Voice Agent Ready",
        description: "Starting your practice call!",
      });
      
      onStartCall?.("General Practice");
      setIsExpanded(false);
      
    } catch (error) {
      console.warn("Ringg AI not available, using demo mode:", error);
      toast({
        title: "Practice Mode",
        description: "Voice practice system ready for demo.",
      });
      onStartCall?.("General Practice");
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChat = () => {
    // Show Ringg AI text chat interface
    toast({
      title: "Text Chat",
      description: "Opening Ringg AI text chat...",
    });
    setIsExpanded(false);
  };

  const handleQABot = () => {
    // Show Botpress Q&A chat
    onShowBotpress?.();
    setIsExpanded(false);
  };

  const initializeRinggVoiceAgent = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if Ringg AI is already loaded
      if ((window as any).loadAgent) {
        (window as any).loadAgent({
          agentId: import.meta.env.VITE_RINGG_AGENT_ID || "373dc1f5-d841-4dc2-8b06-193e5177e0ba",
          xApiKey: import.meta.env.VITE_RINGG_X_API_KEY || "be40b1db-451c-4ede-9acd-2c4403f51ef0",
          variables: {
            callee_name: "CALLEE_NAME",
            mode: "MODE",
            scenario_id: "practice_call"
          }
        });
        resolve();
        return;
      }

      // Load Ringg AI CDN
      const loadAgentsCdn = (version: string, callback: () => void, errorCallback: () => void) => {
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
        script.onerror = errorCallback;
        document.head.appendChild(script);
      };

      loadAgentsCdn("1.0.3", () => {
        if ((window as any).loadAgent) {
          (window as any).loadAgent({
            agentId: import.meta.env.VITE_RINGG_AGENT_ID || "373dc1f5-d841-4dc2-8b06-193e5177e0ba",
            xApiKey: import.meta.env.VITE_RINGG_X_API_KEY || "be40b1db-451c-4ede-9acd-2c4403f51ef0",
            variables: {
              callee_name: "CALLEE_NAME",
              mode: "MODE", 
              scenario_id: "practice_call"
            }
          });
          resolve();
        } else {
          reject(new Error("Ringg AI loadAgent function not available"));
        }
      }, () => {
        reject(new Error("Failed to load Ringg AI script"));
      });
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Options Menu */}
      {isExpanded && (
        <Card className="absolute bottom-20 right-0 w-64 mb-2 shadow-xl border-2">
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-sm">Choose Assistant</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* CM Assistant Q&A Bot */}
            <Button
              onClick={handleQABot}
              variant="outline"
              className="w-full justify-start text-left"
            >
              <i className="fas fa-comments mr-2 text-blue-600"></i>
              <div>
                <div className="font-medium">CM Assistant</div>
                <div className="text-xs text-gray-500">Q&A Support Bot</div>
              </div>
            </Button>

            {/* Ringg AI Voice Call */}
            <Button
              onClick={handleVoiceCall}
              disabled={isLoading}
              variant="outline"
              className="w-full justify-start text-left"
            >
              <i className="fas fa-microphone mr-2 text-green-600"></i>
              <div>
                <div className="font-medium">Voice Practice</div>
                <div className="text-xs text-gray-500">Ringg AI Roleplay</div>
              </div>
            </Button>

            {/* Ringg AI Text Chat */}
            <Button
              onClick={handleTextChat}
              variant="outline"
              className="w-full justify-start text-left"
            >
              <i className="fas fa-keyboard mr-2 text-purple-600"></i>
              <div>
                <div className="font-medium">Text Practice</div>
                <div className="text-xs text-gray-500">Ringg AI Chat</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Floating Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isLoading}
        className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      >
        {isLoading ? (
          <i className="fas fa-spinner fa-spin text-white text-xl"></i>
        ) : isExpanded ? (
          <i className="fas fa-times text-white text-xl"></i>
        ) : (
          <i className="fas fa-robot text-white text-xl"></i>
        )}
      </Button>
      
      {/* Tooltip */}
      {!isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            AI Assistants
          </div>
        </div>
      )}
    </div>
  );
}