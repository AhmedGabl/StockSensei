import { useEffect, useRef } from 'react';
import { User } from '@/lib/types';

interface BotpressChatProps {
  user: User;
  isCollapsed: boolean;
  onToggle: () => void;
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

export function BotpressChat({ user, isCollapsed, onToggle }: BotpressChatProps) {
  const webchatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!webchatRef.current) return;

    const webchatId = 'botpress-webchat-container';
    webchatRef.current.id = webchatId;

    // Add custom styles for full integration
    const style = document.createElement('style');
    style.innerHTML = `
      #${webchatId} .bpWebchat {
        position: unset !important;
        width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
        max-width: 100% !important;
        border: none !important;
        border-radius: 8px !important;
      }

      #${webchatId} .bpFab {
        display: none !important;
      }

      #${webchatId} .bpHeader {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
        color: white !important;
      }

      #${webchatId} .bpSendButton {
        background: #f97316 !important;
      }

      #${webchatId} .bpUserMessage {
        background: #f97316 !important;
      }
    `;
    
    if (!document.getElementById('botpress-custom-styles')) {
      style.id = 'botpress-custom-styles';
      document.head.appendChild(style);
    }

    const initializeBotpress = () => {
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
          "selector": `#${webchatId}`
        });
      }
    };

    // Load Botpress script if not already loaded
    if (!window.botpress && !document.getElementById('botpress-script')) {
      const script = document.createElement('script');
      script.id = 'botpress-script';
      script.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
      script.onload = () => {
        setTimeout(initializeBotpress, 200);
      };
      document.head.appendChild(script);
    } else if (window.botpress) {
      setTimeout(initializeBotpress, 200);
    }

    return () => {
      // Cleanup
      if (webchatRef.current) {
        webchatRef.current.innerHTML = '';
      }
    };
  }, []);

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