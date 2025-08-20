import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VoiceWidgetProps {
  user?: any;
  onStartCall?: () => void;
}

export function VoiceWidget({ user: passedUser, onStartCall }: VoiceWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Use passed user data or fetch if not provided
  const { data: fetchedUser } = useQuery({
    queryKey: ['/api/me'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !passedUser, // Only fetch if user data not passed as prop
  });

  const userData = passedUser || fetchedUser;

  const handleVoiceCall = async () => {
    setIsLoading(true);
    
    try {
      // Try to initialize Ringg AI voice agent with user context
      await initializeRinggVoiceAgent(userData);
      
      toast({
        title: "Voice Agent Ready",
        description: `Starting your practice call${userData?.name ? ` for ${userData.name}` : ''}!`,
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

  const startRecordingPoll = async (ringgCallId: string, userData: any) => {
    try {
      console.log(`Starting recording poll for Ringg call ${ringgCallId}`);
      
      // First, create a practice call record
      const practiceCallResponse = await apiRequest('POST', '/api/practice-calls/start', {
        scenario: 'Voice Practice Call with AI Assistant',
        ringgCallId: ringgCallId
      });
      const practiceCall = await practiceCallResponse.json();
      
      // Then start the background polling
      await apiRequest('POST', '/api/practice-calls/start-recording-poll', {
        ringgCallId: ringgCallId,
        practiceCallId: practiceCall.practiceCall.id
      });
      
      toast({
        title: "Recording Poll Started",
        description: "System will automatically capture recordings and transcripts when available.",
      });
      
    } catch (error) {
      console.error("Error starting recording poll:", error);
      toast({
        title: "Recording Poll Error",
        description: "Could not start automatic recording capture.",
        variant: "destructive"
      });
    }
  };

  const initializeRinggVoiceAgent = (userData?: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Check if Ringg AI is already loaded
        if ((window as any).loadAgent) {
          try {
            // Hook into Ringg AI events to capture call ID
            const originalLoadAgent = (window as any).loadAgent;
            (window as any).loadAgent = function(config: any) {
              // Add call event listeners
              const originalOnCallStart = config.onCallStart;
              config.onCallStart = (callData: any) => {
                console.log("Ringg AI call started:", callData);
                
                // Start recording poll if we have a call ID
                if (callData?.callId) {
                  startRecordingPoll(callData.callId, userData);
                }
                
                // Call original handler if it exists
                if (originalOnCallStart) {
                  originalOnCallStart(callData);
                }
              };
              
              return originalLoadAgent(config);
            };
            
            (window as any).loadAgent({
              agentId: "373dc1f5-d841-4dc2-8b06-193e5177e0ba",
              xApiKey: "be40b1db-451c-4ede-9acd-2c4403f51ef0",
              variables: {
                callee_name: userData?.name || userData?.email?.split('@')[0] || "Student",
                user_email: userData?.email || "",
                user_role: userData?.role || "STUDENT",
                platform: "CM Training Platform",
                mode: "practice_training",
                scenario_id: "practice_call",
                session_type: "roleplay_practice"
              },
              buttons: {
                modalTrigger: {
                  styles: {
                    backgroundColor: "#000000",
                    color: "white",
                    borderRadius: "50%",
                    border: "2px solid #333333",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
                  }
                },
                mic: {
                  styles: {
                    backgroundColor: "#000000",
                    borderRadius: "50%",
                    border: "2px solid #333333",
                    color: "white"
                  }
                },
                call: {
                  textBeforeCall: "Start Practice Call",
                  textDuringCall: "End Practice Call",
                  styles: {
                    backgroundColor: "#000000",
                    color: "white",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontWeight: "500",
                    border: "1px solid #333333"
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
                bottom: 6.5rem !important;
                right: 1.5rem !important;
                z-index: 8888 !important;
              }
              
              .voice-widget-button {
                background-color: #000000 !important;
                color: #ffffff !important;
                border: 2px solid #ffffff !important;
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.3) !important;
                animation: pulse-glow 2s ease-in-out infinite !important;
              }
              
              .voice-widget-button:hover {
                background-color: #111111 !important;
                color: #ffffff !important;
                border-color: #ffffff !important;
                box-shadow: 0 0 30px rgba(255, 255, 255, 0.5) !important;
                transform: scale(1.05) !important;
              }
              
              .voice-widget-button:disabled {
                background-color: #222222 !important;
                color: #ffffff !important;
                border-color: #888888 !important;
                animation: none !important;
              }
              
              @keyframes pulse-glow {
                0%, 100% {
                  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                }
                50% {
                  box-shadow: 0 0 30px rgba(255, 255, 255, 0.6);
                }
              }
              
              /* Force all Ringg AI modal elements to black */
              .dv-agent-modal, .dv-agent-container, .dv-modal, .dv-widget, .dv-call-widget {
                background-color: #000000 !important;
                color: white !important;
                border: 2px solid #333333 !important;
                border-radius: 8px !important;
              }
              
              /* All text elements */
              .dv-agent-modal *, .dv-agent-container *, .dv-modal *, .dv-widget *, .dv-call-widget * {
                background-color: transparent !important;
                color: white !important;
              }
              
              /* Buttons and interactive elements */
              .dv-agent-modal button, .dv-widget button, .dv-call-widget button {
                background-color: #000000 !important;
                color: white !important;
                border: 1px solid #333333 !important;
                border-radius: 4px !important;
              }
              
              .dv-agent-modal button:hover, .dv-widget button:hover, .dv-call-widget button:hover {
                background-color: #111111 !important;
                border-color: #444444 !important;
              }
              
              /* Input fields */
              .dv-agent-modal input, .dv-widget input, .dv-call-widget input {
                background-color: #111111 !important;
                color: white !important;
                border: 1px solid #333333 !important;
                border-radius: 4px !important;
              }
              
              /* Headers and titles */
              .dv-agent-modal h1, .dv-agent-modal h2, .dv-agent-modal h3, .dv-agent-modal h4,
              .dv-widget h1, .dv-widget h2, .dv-widget h3, .dv-widget h4 {
                color: white !important;
                background-color: transparent !important;
              }
              
              /* Call status indicators */
              .dv-call-status, .dv-timer, .dv-status {
                background-color: #111111 !important;
                color: white !important;
                border: 1px solid #333333 !important;
              }
              
              /* Voice indicators and waveforms */
              .dv-voice-indicator, .dv-waveform, .dv-audio-visual {
                background-color: #000000 !important;
                color: #ffffff !important;
              }
              
              /* Modal backdrop */
              .dv-modal-backdrop, .dv-overlay {
                background-color: rgba(0, 0, 0, 0.8) !important;
              }
              
              /* Additional Ringg AI classes - catch all patterns */
              [class*="dv-"], [class*="ringg-"], [class*="agent-"], [class*="call-"] {
                background-color: #000000 !important;
                color: white !important;
              }
              
              [class*="dv-"] button, [class*="ringg-"] button, [class*="agent-"] button, [class*="call-"] button {
                background-color: #000000 !important;
                color: white !important;
                border: 1px solid #333333 !important;
              }
              
              [class*="dv-"] input, [class*="ringg-"] input, [class*="agent-"] input, [class*="call-"] input {
                background-color: #111111 !important;
                color: white !important;
                border: 1px solid #333333 !important;
              }
              
              /* Force any modal or popup to black theme */
              div[role="dialog"], div[role="modal"], .modal, .popup, .widget-container {
                background-color: #000000 !important;
                color: white !important;
                border: 2px solid #333333 !important;
              }
              
              /* Iframe content styling (if applicable) */
              iframe[src*="ringg"], iframe[src*="agent"], iframe[src*="voice"] {
                filter: invert(1) hue-rotate(180deg) !important;
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
              // Extract user information for personalization
              const userName = userData?.user?.email ? userData.user.email.split('@')[0] : 'Student';
              const userEmail = userData?.user?.email || 'Unknown User';
              const userRole = userData?.user?.role || 'STUDENT';
              
              (window as any).loadAgent({
                agentId: import.meta.env.VITE_RINGG_AGENT_ID || "373dc1f5-d841-4dc2-8b06-193e5177e0ba",
                xApiKey: import.meta.env.VITE_RINGG_X_API_KEY || "be40b1db-451c-4ede-9acd-2c4403f51ef0",
                variables: {
                  callee_name: userName,
                  user_email: userEmail,
                  user_role: userRole,
                  platform: "CM_Training_Platform",
                  mode: "practice_call", 
                  scenario_id: "general_training",
                  session_type: "voice_practice"
                },
                theme: {
                  backgroundColor: "#000000",
                  textColor: "#ffffff",
                  borderColor: "#333333",
                  buttonColor: "#000000",
                  buttonTextColor: "#ffffff",
                  accentColor: "#333333"
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
    <div className="voice-widget-container fixed bottom-28 left-6 z-40 font-medium text-left">
      {/* Expanded Options Menu */}
      {isExpanded && (
        <div className="absolute bottom-20 left-0 w-64 mb-2 shadow-xl border-2 rounded-lg p-4 space-y-3" style={{ backgroundColor: '#000000', borderColor: '#ffffff', boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)' }}>
          <div className="pb-2">
            <h3 className="font-semibold text-sm text-white">🎤 Ringg AI Practice</h3>
          </div>
          <div className="space-y-2">
            {/* Ringg AI Voice Call */}
            <button
              onClick={handleVoiceCall}
              disabled={isLoading}
              className="w-full p-3 rounded-lg text-left border-2 hover:bg-gray-900 transition-colors disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: '#000000', borderColor: '#ffffff', color: 'white' }}
            >
              <div className="flex items-center">
                <i className="fas fa-microphone mr-3 text-green-400 text-lg"></i>
                <div>
                  <div className="font-medium text-white">Voice Practice</div>
                  <div className="text-xs text-gray-400">AI Roleplay Calls</div>
                </div>
              </div>
            </button>

            {/* Ringg AI Text Chat */}
            <button
              onClick={handleTextChat}
              disabled={isLoading}
              className="w-full p-3 rounded-lg text-left border-2 hover:bg-gray-900 transition-colors disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: '#000000', borderColor: '#ffffff', color: 'white' }}
            >
              <div className="flex items-center">
                <i className="fas fa-keyboard mr-3 text-purple-400 text-lg"></i>
                <div>
                  <div className="font-medium text-white">Text Practice</div>
                  <div className="text-xs text-gray-400">AI Text Chat</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
      {/* Main Floating Button - Force black styling */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isLoading}
        className="voice-widget-button w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group pulse-ring disabled:opacity-50 cursor-pointer hover:scale-105"
        style={{
          backgroundColor: isLoading ? '#222222' : '#000000',
          color: '#ffffff',
          border: '2px solid #ffffff',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
          outline: 'none'
        }}
      >
        {isLoading ? (
          <i className="fas fa-spinner fa-spin text-white text-xl"></i>
        ) : isExpanded ? (
          <i className="fas fa-times text-white text-xl"></i>
        ) : (
          <i className="fas fa-microphone text-white text-xl"></i>
        )}
      </button>
      {/* Tooltip */}
      {!isExpanded && (
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block">
          <div className="bg-black border border-white text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
            🎤 Ringg AI Practice
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
          </div>
        </div>
      )}
    </div>
  );
}