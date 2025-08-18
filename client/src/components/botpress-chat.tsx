import { useEffect, useRef, useState } from 'react';
import { User } from '@/lib/types';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User as UserIcon } from 'lucide-react';

interface BotpressChatProps {
  user: User;
  isCollapsed: boolean;
  onToggle: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function BotpressChat({ user, isCollapsed, onToggle }: BotpressChatProps) {
  const webchatRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [botpressInitialized, setBotpressInitialized] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your CM Training Q&A assistant. I can help answer questions about training materials, class management techniques, student interaction best practices, and technology usage. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            context: 'You are a Q&A assistant for Class Mentor training. Help with training materials, class management, student interactions, and platform usage.'
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.response;
      } catch (error) {
        console.error('Chat API error:', error);
        throw error;
      }
    },
    onSuccess: (response) => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    // Try to initialize Botpress, but use fallback if it fails
    const initializeBotpress = () => {
      try {
        // Set a timeout to fallback to built-in chat if Botpress fails
        const fallbackTimeout = setTimeout(() => {
          console.log('Botpress initialization timeout, using built-in chat');
          setUseFallback(true);
          setIsLoading(false);
        }, 3000);

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
                  clearTimeout(fallbackTimeout);
                  setBotpressInitialized(true);
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error initializing Botpress webchat:', error);
                  clearTimeout(fallbackTimeout);
                  setUseFallback(true);
                  setIsLoading(false);
                }
              } else {
                console.warn('Botpress webchat not available');
                clearTimeout(fallbackTimeout);
                setUseFallback(true);
                setIsLoading(false);
              }
            }, 1000);
          }
        };

        injectScript.onload = onScriptLoad;
        configScript.onload = onScriptLoad;
        
        injectScript.onerror = () => {
          console.error('Failed to load Botpress inject script');
          clearTimeout(fallbackTimeout);
          setUseFallback(true);
          setIsLoading(false);
        };
        
        configScript.onerror = () => {
          console.error('Failed to load Botpress config script');
          clearTimeout(fallbackTimeout);
          setUseFallback(true);
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
      } catch (error) {
        console.error('Error during Botpress initialization:', error);
        setUseFallback(true);
        setIsLoading(false);
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
          <div className="text-xs text-slate-500">Connecting to chat service...</div>
        </div>
      </div>
    );
  }

  // If Botpress is initialized successfully and not using fallback
  if (botpressInitialized && !useFallback) {
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

  // Fallback built-in chat interface
  return (
    <div className="h-full w-full bg-white rounded-lg overflow-hidden p-4">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Q&A Assistant</h3>
          <p className="text-sm text-gray-600">Ask questions about your CM training</p>
        </div>
        
        {/* Chat Messages Area */}
        <ScrollArea className="flex-1 mb-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-blue-500 text-white'
                }`}>
                  {message.role === 'user' ? (
                    <UserIcon className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-orange-50 text-gray-800'
                    : 'bg-blue-50 text-gray-800'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex gap-2">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here..."
              className="flex-1"
              disabled={chatMutation.isPending}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || chatMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}