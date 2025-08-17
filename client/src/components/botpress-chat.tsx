import { useEffect, useRef, useState } from 'react';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface BotpressChatProps {
  user: User;
  isCollapsed: boolean;
  onToggle: () => void;
}

declare global {
  interface Window {
    botpressWebChat?: any;
  }
}

export function BotpressChat({ user, isCollapsed, onToggle }: BotpressChatProps) {
  const webchatRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // Botpress configuration
    const botId = '3f10c2b1-6fc1-4cf1-9f25-f5db2907d205';
    const clientId = 'b98de221-d1f1-43c7-bad5-f279c104c231';
    const botpressBaseUrl = 'https://cdn.botpress.cloud/webchat/v3.2';

    // Load Botpress script
    const loadBotpress = () => {
      if (window.botpressWebChat) {
        initializeBotpress();
        return;
      }

      const script = document.createElement('script');
      script.src = `${botpressBaseUrl}/inject.js`;
      script.async = true;
      
      script.onload = () => {
        if (window.botpressWebChat) {
          initializeBotpress();
        } else {
          setError('Failed to load Botpress');
          setUseFallback(true);
          setIsLoading(false);
        }
      };
      
      script.onerror = () => {
        console.error('Failed to load Botpress script');
        setError('Failed to load chat service');
        setUseFallback(true);
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };

    const initializeBotpress = () => {
      try {
        window.botpressWebChat.init({
          botId: botId,
          clientId: clientId,
          hostUrl: 'https://cdn.botpress.cloud/webchat/v3.2',
          messagingUrl: 'https://messaging.botpress.cloud',
          botName: '51Talk Training Assistant',
          avatarUrl: 'https://via.placeholder.com/40x40/FF6B35/FFFFFF?text=🤖',
          stylesheet: 'https://webchat-styler-css.botpress.app/prod/code/3f10c2b1-6fc1-4cf1-9f25-f5db2907d205/v80766/style.css',
          frontendVersion: 'v3.2',
          showConversationsButton: false,
          theme: 'prism',
          themeColor: '#FF6B35',
          allowedOrigins: ['*'],
          hideWidget: false,
          disableAnimations: false,
          closeOnEscape: false,
          showPoweredBy: false,
          className: 'botpress-chat-widget',
          containerWidth: '100%',
          layoutWidth: '100%',
          showTimestamp: true,
          enableTranscriptDownload: false,
          startupMessageDelay: 1000,
          userData: {
            name: user.email,
            userId: user.id,
            role: user.role
          }
        });

        // Set the container
        if (webchatRef.current) {
          window.botpressWebChat.renderAt(webchatRef.current);
        }
        
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Botpress initialization error:', err);
        setError('Failed to initialize chat');
        setUseFallback(true);
        setIsLoading(false);
      }
    };

    loadBotpress();

    // Cleanup
    return () => {
      if (window.botpressWebChat) {
        try {
          window.botpressWebChat.destroy?.();
        } catch (err) {
          console.warn('Error destroying Botpress chat:', err);
        }
      }
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center border border-slate-200 rounded-lg bg-white">
        <div className="text-center p-6">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <div className="text-slate-600 mb-2">Loading 51Talk Training Assistant...</div>
          <div className="text-xs text-slate-500">Connecting to Botpress...</div>
        </div>
      </div>
    );
  }

  if (error || useFallback) {
    return (
      <div className="h-full w-full flex items-center justify-center border border-slate-200 rounded-lg bg-white">
        <div className="text-center p-6">
          <div className="text-2xl mb-3">🤖</div>
          <div className="text-slate-600 mb-2">Botpress Chat Unavailable</div>
          <div className="text-xs text-slate-500 mb-4">The Botpress service is currently unavailable</div>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-orange-600 border-orange-600 hover:bg-orange-50"
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div 
        ref={webchatRef} 
        className="h-full w-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}