import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const webchatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && webchatRef.current && !isInitialized && window.botpress) {
      // Initialize Botpress when dialog opens
      setTimeout(() => {
        if (window.botpress && document.getElementById('embedded-webchat')) {
          console.log('Initializing embedded Botpress webchat...');
          
          window.botpress.on("webchat:ready", () => {
            console.log('Embedded Botpress webchat ready, opening...');
            window.botpress.open();
          });

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
            "selector": "#embedded-webchat"
          });

          setIsInitialized(true);
        }
      }, 300);
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

      {/* Chat Dialog with Embedded Botpress */}
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
          
          <div className="h-[500px] relative">
            <div 
              ref={webchatRef}
              id="embedded-webchat" 
              style={{ width: '100%', height: '100%' }}
            />
            {!isInitialized && isOpen && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading 51talk CM Assistant...</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}