import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User } from "@shared/schema";

interface FloatingChatBubbleProps {
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

export function FloatingChatBubble({ user }: FloatingChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const webchatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add Botpress styles
    if (!document.querySelector('#botpress-styles')) {
      const style = document.createElement('style');
      style.id = 'botpress-styles';
      style.textContent = `
        .bp-webchat-container .bpWebchat {
          position: unset !important;
          width: 100% !important;
          height: 100% !important;
          max-height: 100% !important;
          max-width: 100% !important;
        }
        .bp-webchat-container .bpFab {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Load Botpress script
    if (!document.querySelector('script[src="https://cdn.botpress.cloud/webchat/v3.2/inject.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (isOpen && webchatRef.current && !isInitialized) {
      // Wait for DOM and script to be ready
      const timer = setTimeout(() => {
        if (window.botpress) {
          console.log('Initializing Botpress...');
          
          window.botpress.init({
            "botId": "3f10c2b1-6fc1-4cf1-9f25-f5db2907d205",
            "configuration": {
              "version": "v1",
              "botName": "51talk CM",
              "fabImage": "https://files.bpcontent.cloud/2025/08/17/14/20250817143903-J6S55SD1.jpeg",
              "website": {},
              "email": {},
              "phone": {},
              "termsOfService": {},
              "privacyPolicy": {},
              "color": "#3276EA",
              "variant": "solid",
              "headerVariant": "glass",
              "themeMode": "dark",
              "fontFamily": "inter",
              "radius": 4,
              "feedbackEnabled": false,
              "footer": "[⚡ by Botpress](https://botpress.com/?from=webchat)",
              "additionalStylesheetUrl": "https://files.bpcontent.cloud/2025/08/17/14/20250817144447-K1GSV0DH.css",
              "allowFileUpload": false
            },
            "clientId": "b98de221-d1f1-43c7-bad5-f279c104c231",
            "selector": "#bp-webchat"
          });

          window.botpress.on("webchat:ready", () => {
            console.log('Botpress ready, opening...');
            window.botpress.open();
          });

          setIsInitialized(true);
        } else {
          console.log('Botpress not loaded yet');
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isInitialized]);

  return (
    <>
      {/* Floating Chat Bubble */}
      <div className="fixed bottom-4 right-20 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* Chat Dialog with Botpress */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[600px] p-0">
          <DialogHeader className="px-4 py-3 bg-blue-500 text-white">
            <DialogTitle className="flex items-center justify-between">
              <span>51talk CM Assistant</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="h-[500px] bp-webchat-container">
            <div 
              ref={webchatRef}
              id="bp-webchat" 
              style={{ width: '100%', height: '100%' }}
            />
            {!isInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading chat...</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}