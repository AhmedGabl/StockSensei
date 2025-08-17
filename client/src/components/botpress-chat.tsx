import { useEffect, useRef, useState } from 'react';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';

interface BotpressChatProps {
  user: User;
  isCollapsed: boolean;
  onToggle: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function BotpressChat({ user, isCollapsed, onToggle }: BotpressChatProps) {
  const webchatRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your 51Talk Training Assistant. Ask me anything about Class Mentor training, student management, or 51Talk procedures.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: message }]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try asking your question again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!webchatRef.current || useFallback) return;

    const timer = setTimeout(() => {
      setUseFallback(true);
      setIsLoading(false);
    }, 5000); // Switch to fallback after 5 seconds

    return () => clearTimeout(timer);
  }, [useFallback]);

  if (useFallback || error) {
    return (
      <div className="h-full w-full flex flex-col border border-slate-200 rounded-lg">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xs">🤖</span>
            </div>
            <h3 className="font-medium">51Talk Training Assistant</h3>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4 min-h-[250px] max-h-[250px]">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-800 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
              placeholder="Ask about Class Mentor training, procedures, or student management..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button 
              onClick={() => sendMessage(inputMessage)}
              disabled={isTyping || !inputMessage.trim()}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center border border-slate-200 rounded-lg">
      <div className="text-center p-6">
        <div className="text-2xl mb-2">🤖</div>
        <div className="text-slate-600 mb-4">Loading 51Talk Training Assistant...</div>
        <Button 
          variant="outline"
          onClick={() => setUseFallback(true)}
          className="text-orange-600 border-orange-600 hover:bg-orange-50"
        >
          Use Built-in Chat
        </Button>
      </div>
    </div>
  );
}