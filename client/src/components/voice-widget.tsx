import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface VoiceWidgetProps {
  onStartCall?: () => void;
}

export function VoiceWidget({ onStartCall }: VoiceWidgetProps) {
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
      
      onStartCall?.();
      setIsExpanded(false);
      
    } catch (error) {
      console.warn("Ringg AI not available, using demo mode:", error);
      toast({
        title: "Practice Mode",
        description: "Voice practice system ready for demo.",
      });
      onStartCall?.();
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

  const initializeRinggVoiceAgent = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Check if Ringg AI is already loaded
        if ((window as any).loadAgent) {
          try {
            (window as any).loadAgent({
              agentId: "373dc1f5-d841-4dc2-8b06-193e5177e0ba",
              xApiKey: "be40b1db-451c-4ede-9acd-2c4403f51ef0",
              variables: {
                callee_name: "CALLEE_NAME",
                mode: "MODE",
                scenario_id: "practice_call"
              },
              buttons: {
                modalTrigger: {
                  styles: {
                    backgroundColor: "hsl(207, 90%, 54%)",
                    color: "white",
                    borderRadius: "50%",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                  }
                },
                mic: {
                  styles: {
                    backgroundColor: "hsl(0, 84%, 60%)",
                    borderRadius: "50%",
                    border: "2px solid white"
                  }
                },
                call: {
                  textBeforeCall: "Start Practice Call",
                  textDuringCall: "End Practice Call",
                  styles: {
                    backgroundColor: "hsl(207, 90%, 54%)",
                    color: "white",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontWeight: "500"
                  }
                }
              }
            });
            resolve();
            return;
          } catch (error) {
            console.error("Error calling loadAgent:", error);
            resolve(); // Resolve anyway to prevent blocking UI
            return;
          }
        }

        // Load Ringg AI CDN
        const loadAgentsCdn = (version: string, callback: () => void, errorCallback: () => void) => {
          try {
            // Load CSS with scoped styles to prevent conflicts
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = `https://cdn.jsdelivr.net/npm/@desivocal/agents-cdn@${version}/dist/style.css`;
            
            // Add CSS to isolate Ringg styles and protect voice widget
            const style = document.createElement("style");
            style.textContent = `
              /* Isolate Ringg AI styles and prevent conflicts */
              .ringg-ai-container {
                all: initial;
                font-family: inherit;
                z-index: 10000;
              }
              
              /* Prevent Ringg AI from overriding our app styles */
              .cm-training-app {
                isolation: isolate;
              }
              
              /* Protect voice widget from color distortion */
              .voice-widget-container {
                isolation: isolate !important;
                position: fixed !important;
                bottom: 1.5rem !important;
                left: 1.5rem !important;
                z-index: 9999 !important;
              }
              
              .voice-widget-button {
                background-color: #1f2937 !important;
                color: #ffffff !important;
                border: none !important;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
              }
              
              .voice-widget-button:hover {
                background-color: #374151 !important;
                color: #ffffff !important;
              }
              
              .voice-widget-button:disabled {
                background-color: #6b7280 !important;
                color: #ffffff !important;
              }
            `;
            document.head.appendChild(style);
            document.head.appendChild(link);

            // Load JS
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.src = `https://cdn.jsdelivr.net/npm/@desivocal/agents-cdn@${version}/dist/dv-agent.es.js`;
            script.onload = callback;
            script.onerror = errorCallback;
            document.head.appendChild(script);
          } catch (error) {
            console.error("Error loading Ringg AI CDN:", error);
            errorCallback();
          }
        };

        loadAgentsCdn("1.0.3", () => {
          try {
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
              console.warn("Ringg AI loadAgent function not available");
              resolve(); // Resolve anyway to prevent blocking UI
            }
          } catch (error) {
            console.error("Error initializing Ringg AI:", error);
            resolve(); // Resolve anyway to prevent blocking UI
          }
        }, () => {
          console.warn("Failed to load Ringg AI script");
          resolve(); // Resolve anyway to prevent blocking UI
        });
      } catch (error) {
        console.error("Error in initializeRinggVoiceAgent:", error);
        resolve(); // Resolve anyway to prevent blocking UI
      }
    });
  };

  return (
    <div className="voice-widget-container fixed bottom-6 left-6 z-50">
      {/* Expanded Options Menu */}
      {isExpanded && (
        <Card className="absolute bottom-20 left-0 w-64 mb-2 shadow-xl border-2 bg-white dark:bg-gray-800">
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Ringg AI Practice</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Ringg AI Voice Call */}
            <Button
              onClick={handleVoiceCall}
              disabled={isLoading}
              variant="outline"
              className="w-full justify-start text-left bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <i className="fas fa-microphone mr-2 text-green-600"></i>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Voice Practice</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">AI Roleplay Calls</div>
              </div>
            </Button>

            {/* Ringg AI Text Chat */}
            <Button
              onClick={handleTextChat}
              variant="outline"
              className="w-full justify-start text-left bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <i className="fas fa-keyboard mr-2 text-purple-600"></i>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Text Practice</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">AI Text Chat</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Floating Button - Force black styling */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isLoading}
        className="voice-widget-button w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group border-0"
        style={{
          backgroundColor: isLoading ? '#6b7280' : '#1f2937',
          color: '#ffffff',
          border: 'none'
        }}
      >
        {isLoading ? (
          <i className="fas fa-spinner fa-spin text-white text-xl"></i>
        ) : isExpanded ? (
          <i className="fas fa-times text-white text-xl"></i>
        ) : (
          <i className="fas fa-microphone text-white text-xl"></i>
        )}
      </Button>
      
      {/* Tooltip */}
      {!isExpanded && (
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block">
          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            Ringg AI Practice
          </div>
        </div>
      )}
    </div>
  );
}