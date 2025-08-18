import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FloatingChatBubbleProps {
  user: User;
}

export function FloatingChatBubble({ user }: FloatingChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your CM Training assistant. Ask me about training materials, class management, student interactions, or platform usage.',
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

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[600px] p-0">
          <DialogHeader className="px-4 py-3 bg-blue-500 text-white">
            <DialogTitle className="flex items-center justify-between">
              <span>Q&A Assistant</span>
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
          
          <div className="flex flex-col h-[500px]">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white ml-auto' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className={`text-xs mt-1 opacity-70 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
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
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}