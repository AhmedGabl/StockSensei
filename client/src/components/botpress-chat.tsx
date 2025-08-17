import { useEffect, useRef } from 'react';
import { User } from '@/lib/types';

interface BotpressChatProps {
  user: User;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function BotpressChat({ user, isCollapsed, onToggle }: BotpressChatProps) {
  const webchatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!webchatRef.current) return;

    // Clean approach using the embed HTML directly
    webchatRef.current.innerHTML = `
      <style>
        .bpWebchat {
          position: unset !important;
          width: 100% !important;
          height: 100% !important;
          max-height: 100% !important;
          max-width: 100% !important;
          border: none !important;
          border-radius: 8px !important;
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
      </style>
      <div id="webchat-container" style="width: 100%; height: 100%; min-height: 400px;"></div>
      <script src="https://cdn.botpress.cloud/webchat/v3.2/inject.js"></script>
      <script>
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
          "selector": "#webchat-container"
        });
      </script>
    `;
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