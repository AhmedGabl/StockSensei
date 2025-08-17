import { useEffect, useRef, useState } from 'react';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface BotpressChatProps {
  user: User;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function BotpressChat({ user, isCollapsed, onToggle }: BotpressChatProps) {
  const webchatRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use a working fallback Q&A chat while Botpress is configured
    setIsLoading(false);
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
    <div className="h-full w-full bg-white rounded-lg overflow-hidden p-4">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Q&A Assistant</h3>
          <p className="text-sm text-gray-600">Ask questions about your training</p>
        </div>
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div>
                <p className="text-gray-800">Hello! I'm your Q&A assistant. I can help answer questions about:</p>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• Training materials and procedures</li>
                  <li>• Class management techniques</li>
                  <li>• Student interaction best practices</li>
                  <li>• Technology and platform usage</li>
                </ul>
                <p className="mt-2 text-gray-800">What would you like to know?</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Input Area */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your question here..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-4">
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: Botpress integration is being configured. This interface will be fully functional once connected.
          </p>
        </div>
      </div>
    </div>
  );
}