import { useState, useEffect } from "react";
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
  const [botpressLoaded, setBotpressLoaded] = useState(false);

  useEffect(() => {
    // Add custom styles
    if (!document.querySelector('#botpress-webchat-styles')) {
      const style = document.createElement('style');
      style.id = 'botpress-webchat-styles';
      style.textContent = `
        #webchat .bpWebchat {
          position: unset;
          width: 100%;
          height: 100%;
          max-height: 100%;
          max-width: 100%;
        }

        #webchat .bpFab {
          display: none;
        }
      `;
      document.head.appendChild(style);
    }

    // Load Botpress script if not already loaded
    if (!document.querySelector('script[src="https://cdn.botpress.cloud/webchat/v3.2/inject.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
      script.onload = () => {
        setBotpressLoaded(true);
      };
      document.head.appendChild(script);
    } else if (window.botpress) {
      setBotpressLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Initialize Botpress when dialog is open and script is loaded
    if (isOpen && botpressLoaded && document.getElementById('webchat')) {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        initializeBotpress();
      }, 100);
    }
  }, [isOpen, botpressLoaded]);

  const initializeBotpress = () => {
    if (window.botpress && document.getElementById('webchat')) {
      console.log('Initializing Botpress webchat...');
      
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
        "selector": "#webchat"
      });

      window.botpress.on("webchat:ready", () => {
        console.log('Botpress webchat ready, opening...');
        window.botpress.open();
      });
    }
  };

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
          
          <div className="h-[500px]">
            {botpressLoaded ? (
              <div id="webchat" style={{ width: '100%', height: '100%' }}></div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading chat...</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}