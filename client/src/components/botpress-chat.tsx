import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User as UserIcon, Settings } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

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

// Method 1: React Component Integration
function BotpressReactMethod() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
    script.onload = () => {
      if ((window as any).botpressWebChat) {
        (window as any).botpressWebChat.mergeConfig({
          botId: '3f10c2b1-6fc1-4cf1-9f25-f5db2907d205',
          clientId: 'b98de221-d1f1-43c7-bad5-f279c104c231',
          hideWidget: true,
          containerWidth: '100%',
          layoutWidth: '100%'
        });
        setIsInitialized(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  if (!isInitialized) {
    return <div className="flex items-center justify-center p-4">Loading React integration...</div>;
  }

  return (
    <div className="h-full">
      <div id="bp-react-container" className="h-full" />
    </div>
  );
}

// Method 2: Embed Integration
function BotpressEmbedMethod() {
  return (
    <div className="h-full">
      <iframe
        src="https://cdn.botpress.cloud/webchat/v3.2/shareable.html?botId=3f10c2b1-6fc1-4cf1-9f25-f5db2907d205&clientId=b98de221-d1f1-43c7-bad5-f279c104c231&theme=prism&themeColor=%23ea580c"
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none', 
          borderRadius: '8px',
          minHeight: '400px'
        }}
        title="CM Training Q&A Assistant"
        allow="microphone"
      />
    </div>
  );
}

// Method 3: Bubble Integration
function BotpressBubbleMethod() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
    script.onload = () => {
      const configScript = document.createElement('script');
      configScript.innerHTML = `
        window.botpressWebChat.init({
          botId: '3f10c2b1-6fc1-4cf1-9f25-f5db2907d205',
          clientId: 'b98de221-d1f1-43c7-bad5-f279c104c231',
          hostUrl: 'https://cdn.botpress.cloud/webchat/v3.2',
          messagingUrl: 'https://messaging.botpress.cloud',
          enableConversationDeletion: true,
          showPoweredBy: false,
          theme: 'prism',
          themeColor: '#ea580c',
          allowedOrigins: [],
          composerPlaceholder: 'Ask me about CM training...',
          botConversationDescription: 'CM Training Q&A Assistant - Ask questions about training materials, class management, and platform usage.',
          botName: 'CM Training Assistant',
          hideWidget: false
        });
      `;
      document.head.appendChild(configScript);
      setIsInitialized(true);
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div className="flex items-center justify-center p-4">
      {isInitialized ? (
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            Botpress chat bubble initialized
          </div>
          <div className="text-xs text-gray-500">
            Look for the chat widget in the bottom-right corner
          </div>
        </div>
      ) : (
        <div>Initializing bubble chat...</div>
      )}
    </div>
  );
}

// Fallback OpenAI Chat
function FallbackChat({ user }: { user: User }) {
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

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-orange-500 text-white ml-auto' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className={`text-xs mt-1 opacity-70 ${
                  message.role === 'user' ? 'text-orange-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about CM training..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={chatMutation.isPending}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || chatMutation.isPending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BotpressChat({ user, isCollapsed, onToggle }: BotpressChatProps) {
  const [integrationMethod, setIntegrationMethod] = useState<'react' | 'embed' | 'bubble' | 'fallback'>('embed');
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    if (isCollapsed) return;

    // Try different methods in sequence if previous ones fail
    const timer = setTimeout(() => {
      if (attemptCount < 3) {
        const methods: Array<'embed' | 'bubble' | 'react' | 'fallback'> = ['embed', 'bubble', 'react', 'fallback'];
        const nextMethod = methods[attemptCount] || 'fallback';
        setIntegrationMethod(nextMethod);
        setAttemptCount(prev => prev + 1);
      }
    }, 3000); // Wait 3 seconds before trying next method

    return () => clearTimeout(timer);
  }, [isCollapsed, attemptCount]);

  if (isCollapsed) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Method selector for testing */}
      <div className="p-2 border-b flex gap-2 items-center">
        <Settings className="w-4 h-4" />
        <span className="text-xs font-medium">Integration:</span>
        <select 
          value={integrationMethod} 
          onChange={(e) => setIntegrationMethod(e.target.value as any)}
          className="text-xs border rounded px-1"
        >
          <option value="embed">Method 2: Embed</option>
          <option value="bubble">Method 3: Bubble</option>
          <option value="react">Method 1: React</option>
          <option value="fallback">Fallback: OpenAI</option>
        </select>
      </div>

      <div className="flex-1">
        {integrationMethod === 'react' && <BotpressReactMethod />}
        {integrationMethod === 'embed' && <BotpressEmbedMethod />}
        {integrationMethod === 'bubble' && <BotpressBubbleMethod />}
        {integrationMethod === 'fallback' && <FallbackChat user={user} />}
      </div>
    </div>
  );
}