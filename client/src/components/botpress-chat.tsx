import { useEffect, useRef, useState } from 'react';
import { User } from '@/lib/types';

interface BotpressChatProps {
  user: User;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function BotpressChat({ user, isCollapsed, onToggle }: BotpressChatProps) {
  const webchatRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!webchatRef.current) return;

    const initializeBotpress = () => {
      try {
        setIsLoading(true);
        setError(null);

        // Clear any existing content
        webchatRef.current!.innerHTML = '';

        // Create unique container ID to avoid conflicts
        const containerId = `webchat-container-${Date.now()}`;

        // Set up the HTML structure
        webchatRef.current!.innerHTML = `
          <style>
            .bpWebchat {
              position: unset !important;
              width: 100% !important;
              height: 100% !important;
              max-height: 100% !important;
              max-width: 100% !important;
              border: none !important;
              border-radius: 8px !important;
              box-shadow: none !important;
            }

            .bpFab {
              display: none !important;
            }

            .bpHeader {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
              color: white !important;
            }

            .bpSendButton {
              background: #f97316 !important;
            }

            .bpUserMessage {
              background: #f97316 !important;
            }

            .bpContainer {
              border: none !important;
              box-shadow: none !important;
            }
          </style>
          <div id="${containerId}" style="width: 100%; height: 300px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b;">
              <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 8px;">🤖</div>
                <div>Loading 51Talk Training Assistant...</div>
              </div>
            </div>
          </div>
        `;

        // Load Botpress script
        const script = document.createElement('script');
        script.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
        script.onload = () => {
          try {
            // Wait a bit for the script to initialize
            setTimeout(() => {
              if ((window as any).botpress) {
                (window as any).botpress.init({
                  "botId": "3f10c2b1-6fc1-4cf1-9f25-f5db2907d205",
                  "configuration": {
                    "version": "v1",
                    "website": {},
                    "email": {},
                    "phone": {},
                    "termsOfService": {},
                    "privacyPolicy": {},
                    "color": "#f97316",
                    "variant": "solid", 
                    "headerVariant": "glass",
                    "themeMode": "light",
                    "fontFamily": "inter",
                    "radius": 4,
                    "feedbackEnabled": false,
                    "footer": "[⚡ by Botpress](https://botpress.com/?from=webchat)"
                  },
                  "clientId": "b98de221-d1f1-43c7-bad5-f279c104c231",
                  "selector": `#${containerId}`
                });

                (window as any).botpress.on("webchat:ready", () => {
                  setIsLoading(false);
                  (window as any).botpress.open();
                });

                (window as any).botpress.on("webchat:error", (error: any) => {
                  console.error("Botpress error:", error);
                  setError("Chat service unavailable. Please try again later.");
                  setIsLoading(false);
                });
              } else {
                throw new Error("Botpress script failed to load");
              }
            }, 100);
          } catch (err) {
            console.error("Botpress initialization error:", err);
            setError("Failed to initialize chat. Please refresh and try again.");
            setIsLoading(false);
          }
        };

        script.onerror = () => {
          console.error("Failed to load Botpress script");
          setError("Chat service unavailable. Please check your internet connection.");
          setIsLoading(false);
        };

        document.head.appendChild(script);

        // Cleanup function
        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (err) {
        console.error("Botpress setup error:", err);
        setError("Failed to setup chat. Please try again.");
        setIsLoading(false);
      }
    };

    const cleanup = initializeBotpress();
    return cleanup;
  }, []);

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center border border-slate-200 rounded-lg">
        <div className="text-center p-6">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <div className="text-slate-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div 
        ref={webchatRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}