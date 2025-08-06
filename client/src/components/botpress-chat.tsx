import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@/lib/types";

interface BotpressChatProps {
  user: User;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function BotpressChat({ user, isCollapsed = false, onToggle }: BotpressChatProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      initializeBotpress();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const initializeBotpress = () => {
    // Load Botpress webchat script
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v1/inject.js';
    script.onload = () => {
      // Initialize Botpress
      const initScript = document.createElement('script');
      initScript.innerHTML = `
        window.botpressWebChat.init({
          botId: "${import.meta.env.VITE_BOTPRESS_BOT_ID || "your-bot-id"}",
          hostUrl: "${import.meta.env.VITE_BOTPRESS_WEBCHAT_HOST || "https://cdn.botpress.cloud/webchat/v1"}",
          messagingUrl: "${import.meta.env.VITE_BOTPRESS_MESSAGING_URL || "https://messaging.botpress.cloud"}",
          clientId: "${import.meta.env.VITE_BOTPRESS_CLIENT_ID || "your-client-id"}",
          stylesheet: "",
          composerPlaceholder: "Ask about SOPs, VOIP, curriculum…",
          showCloseButton: true,
          hideWidget: false,
          useSessionStorage: true,
          userData: { email: "${user.email}" }
        });
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

      <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Demo messages - replace with actual Botpress integration */}
        <div className="flex items-start space-x-2">
          <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-robot text-xs"></i>
          </div>
          <div className="bg-slate-100 rounded-lg rounded-tl-none p-3 max-w-xs">
            <p className="text-sm text-slate-700">
              Hi! I'm here to help with your CM training. How can I assist you today?
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2 justify-end">
          <div className="bg-primary text-white rounded-lg rounded-tr-none p-3 max-w-xs">
            <p className="text-sm">I just completed a practice call. What should I do next?</p>
          </div>
          <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-slate-600">
              {user.name?.charAt(0) || user.email.charAt(0)}
            </span>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-robot text-xs"></i>
          </div>
          <div className="bg-slate-100 rounded-lg rounded-tl-none p-3 max-w-xs">
            <p className="text-sm text-slate-700">
              Great work! I'd recommend taking the SOP 4th Call quiz to test your knowledge. Would you like me to start it for you?
            </p>
          </div>
        </div>
      </CardContent>

      <div className="p-4 border-t border-slate-200">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Ask about SOPs, VOIP, curriculum..."
            className="flex-1"
          />
          <Button className="px-3">
            <i className="fas fa-paper-plane text-sm"></i>
          </Button>
        </div>
      </div>
    </Card>
  );
}
