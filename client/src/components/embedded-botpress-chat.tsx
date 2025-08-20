import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { User } from "@shared/schema";

interface EmbeddedBotpressChatProps {
  user: User;
}

declare global {
  interface Window {
    botpress: {
      init: (config: any) => void;
      open: () => void;
      close: () => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

export function EmbeddedBotpressChat({ user }: EmbeddedBotpressChatProps) {
  const [isWebchatOpen, setIsWebchatOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const webchatRef = useRef<HTMLDivElement>(null);

  // Load Botpress script when component mounts
  useEffect(() => {
    const loadBotpressScript = () => {
      if (document.getElementById('botpress-inject')) return;
      
      const script = document.createElement('script');
      script.id = 'botpress-inject';
      script.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
      script.defer = true;
      document.head.appendChild(script);
    };

    loadBotpressScript();
  }, []);

  // Initialize Botpress when webchat opens
  useEffect(() => {
    if (isWebchatOpen && webchatRef.current && !isInitialized) {
      const initBotpress = () => {
        if (window.botpress && document.getElementById('embedded-webchat')) {
          console.log('Initializing embedded Botpress webchat...');
          
          window.botpress?.on("webchat:ready", () => {
            console.log('Embedded Botpress webchat ready, opening...');
            window.botpress?.open();
          });

          window.botpress?.init({
            "botId": "3f10c2b1-6fc1-4cf1-9f25-f5db2907d205",
            "clientId": "b98de221-d1f1-43c7-bad5-f279c104c231",
            "selector": "#embedded-webchat",
            "configuration": {
              "version": "v1",
              "botName": "51talk CM",
              "fabImage": "https://files.bpcontent.cloud/2025/08/17/14/20250817143903-J6S55SD1.jpeg",
              "website": {},
              "email": {},
              "phone": {},
              "termsOfService": {},
              "privacyPolicy": {},
              "color": "#000000",
              "variant": "solid",
              "headerVariant": "glass",
              "themeMode": "dark",
              "fontFamily": "inter",
              "radius": 4,
              "feedbackEnabled": false,
              "footer": "[⚡ by Botpress](https://botpress.com/?from=webchat)",
              "additionalStylesheetUrl": "https://files.bpcontent.cloud/2025/08/17/14/20250817144447-K1GSV0DH.css",
              "allowFileUpload": false
            }
          });

          setIsInitialized(true);
        } else {
          // Retry after a short delay
          setTimeout(initBotpress, 500);
        }
      };

      // Start initialization after a brief delay
      setTimeout(initBotpress, 300);
    }
  }, [isWebchatOpen, isInitialized]);

  const toggleWebchat = () => {
    setIsWebchatOpen((prevState) => !prevState);
  };

  return (
    <div className="fixed bottom-4 right-20 z-50">
      {/* Custom Floating Chat Bubble - same style as before */}
      <Button
        onClick={toggleWebchat}
        className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
      
      {/* Embedded Webchat - positioned absolutely */}
      <div
        className="fixed bottom-20 right-4 z-50"
        style={{
          display: isWebchatOpen ? 'block' : 'none',
          width: '380px',
          height: '500px',
        }}
      >
        <div 
          ref={webchatRef}
          id="embedded-webchat" 
          className="w-full h-full bg-white rounded-lg shadow-lg"
        />
        {!isInitialized && isWebchatOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-gray-500">Loading 51talk CM Assistant...</div>
          </div>
        )}
      </div>
    </div>
  );
}