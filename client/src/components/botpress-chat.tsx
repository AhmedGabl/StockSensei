import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types";

interface BotpressChatProps {
  user: User;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function BotpressChat({ user, isCollapsed = false, onToggle }: BotpressChatProps) {
  const webchatRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isCollapsed && !isInitializedRef.current && webchatRef.current) {
      initializeBotpress();
      isInitializedRef.current = true;
    }
  }, [isCollapsed]);

  const initializeBotpress = () => {
    // Load CSS styles for embedded webchat
    const style = document.createElement('style');
    style.textContent = `
      #webchat .bpWebchat {
        position: unset !important;
        width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      
      #webchat .bpFab {
        display: none !important;
      }
      
      #webchat .bpWebchat iframe {
        border-radius: 0 !important;
      }
    `;
    document.head.appendChild(style);

    // Load Botpress webchat script
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
    script.onload = () => {
      // Initialize Botpress with the configuration you provided
      const initScript = document.createElement('script');
      initScript.innerHTML = `
        if (window.botpress) {
          window.botpress.on("webchat:ready", () => {
            window.botpress.open();
          });
          
          window.botpress.init({
            "botId": "3f10c2b1-6fc1-4cf1-9f25-f5db2907d205",
            "configuration": {
              "version": "v1",
              "website": {},
              "email": {},
              "phone": {},
              "termsOfService": {},
              "privacyPolicy": {},
              "color": "#3276EA",
              "variant": "solid",
              "headerVariant": "glass",
              "themeMode": "light",
              "fontFamily": "inter",
              "radius": 4,
              "feedbackEnabled": false,
              "footer": "[⚡ by Botpress](https://botpress.com/?from=webchat)"
            },
            "clientId": "b98de221-d1f1-43c7-bad5-f279c104c231",
            "selector": "#webchat"
          });
        }
      `;
      document.head.appendChild(initScript);
    };
    document.head.appendChild(script);
  };

  if (isCollapsed) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 shadow-lg"
      >
        <i className="fas fa-comments"></i>
      </Button>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="p-4 border-b border-slate-200 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
            <i className="fas fa-robot text-sm"></i>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">CM Assistant</h4>
            <p className="text-xs text-emerald-500">● Online</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-slate-400 hover:text-slate-600"
        >
          <i className="fas fa-minus"></i>
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        {/* Botpress embedded webchat */}
        <div 
          ref={webchatRef}
          id="webchat" 
          className="w-full h-full"
        />
      </CardContent>
    </Card>
  );
}
