import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VoiceWidgetProps {
  onStartCall?: (scenario: string) => void;
}

export function VoiceWidget({ onStartCall }: VoiceWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStartCall = async () => {
    setIsLoading(true);
    
    try {
      // Try to initialize Ringg AI voice agent
      await initializeRinggVoiceAgent();
      
      toast({
        title: "Voice Agent Ready",
        description: "You can now start your practice call!",
      });
      
      // Trigger practice call if callback provided
      onStartCall?.("General Practice");
      
    } catch (error) {
      console.warn("Ringg AI not available, using demo mode:", error);
      toast({
        title: "Practice Mode",
        description: "Voice practice system ready for demo.",
      });
      onStartCall?.("General Practice");
    } finally {
      setIsLoading(false);
    }
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
      <Button
        onClick={handleStartCall}
        disabled={isLoading}
        className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <i className="fas fa-spinner fa-spin text-white text-xl"></i>
        ) : (
          <div className="flex flex-col items-center">
            <i className="fas fa-microphone text-white text-xl"></i>
            <span className="text-xs text-white mt-1">Practice</span>
          </div>
        )}
      </Button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
        <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          Start Voice Practice Call
        </div>
      </div>
    </div>
  );
}