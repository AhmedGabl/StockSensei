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

  useEffect(() => {
    const initializeBotpress = () => {
      // Load Botpress inject script
      const injectScript = document.createElement('script');
      injectScript.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
      injectScript.defer = true;
      
      // Load configuration script  
      const configScript = document.createElement('script');
      configScript.src = 'https://files.bpcontent.cloud/2025/07/29/10/20250729105930-W64A6MNX.js';
      configScript.defer = true;
      
      // Handle script loading completion
      let scriptsLoaded = 0;
      const onScriptLoad = () => {
        scriptsLoaded++;
        if (scriptsLoaded === 2) {
          // Both scripts loaded, initialize webchat
          setTimeout(() => {
            if ((window as any).botpressWebChat) {
              try {
                (window as any).botpressWebChat.init({
                  composerPlaceholder: 'Ask me anything about CM training...',
                  botConversationDescription: 'CM Training Q&A Assistant',
                  botName: 'CM Assistant',
                  hideWidget: false,
                  disableAnimations: false,
                  closeOnEscape: true,
                  showConversationsButton: false,
                  enableTranscriptDownload: false
                });
                setIsLoading(false);
              } catch (error) {
                console.error('Error initializing Botpress webchat:', error);
                setIsLoading(false);
              }
            } else {
              console.warn('Botpress webchat not available');
              setIsLoading(false);
            }
          }, 1000);
        }
      };

      injectScript.onload = onScriptLoad;
      configScript.onload = onScriptLoad;
      
      injectScript.onerror = () => {
        console.error('Failed to load Botpress inject script');
        setIsLoading(false);
      };
      
      configScript.onerror = () => {
        console.error('Failed to load Botpress config script');
        setIsLoading(false);
      };

      // Check if scripts are already loaded
      const existingInject = document.querySelector('script[src="https://cdn.botpress.cloud/webchat/v3.2/inject.js"]');
      const existingConfig = document.querySelector('script[src="https://files.bpcontent.cloud/2025/07/29/10/20250729105930-W64A6MNX.js"]');
      
      if (!existingInject) {
        document.head.appendChild(injectScript);
      } else {
        onScriptLoad();
      }
      
      if (!existingConfig) {
        document.head.appendChild(configScript);
      } else {
        onScriptLoad();
      }
    };

    initializeBotpress();

    return () => {
      // Cleanup if needed
      if ((window as any).botpressWebChat?.destroy) {
        try {
          (window as any).botpressWebChat.destroy();
        } catch (error) {
          console.warn('Error destroying Botpress webchat:', error);
        }
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-lg border border-orange-200">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <div className="text-slate-600 mb-2">Loading Q&A Assistant...</div>
          <div className="text-xs text-slate-500">Connecting to Botpress...</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={webchatRef} className="h-full w-full bg-white rounded-lg overflow-hidden">
      {/* Botpress webchat will be injected here automatically */}
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">CM Training Assistant</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your Q&A assistant is ready to help with training materials, class management, and platform usage.
          </p>
          <div className="text-xs text-gray-500">
            Botpress webchat is now active
          </div>
        </div>
      </div>
    </div>
  );
}