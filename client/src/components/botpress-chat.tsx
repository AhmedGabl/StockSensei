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
    // Direct Botpress iframe approach for Q&A chat
    const botId = '3f10c2b1-6fc1-4cf1-9f25-f5db2907d205';
    
    if (webchatRef.current) {
      // Clear any existing content
      webchatRef.current.innerHTML = '';
      
      // Create iframe directly for Botpress chat
      const iframe = document.createElement('iframe');
      iframe.src = `https://webchat.botpress.cloud/${botId}`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.style.backgroundColor = '#ffffff';
      
      // Add loading listener
      iframe.onload = () => {
        setIsLoading(false);
      };
      
      webchatRef.current.appendChild(iframe);
    }

    // Cleanup function
    return () => {
      if (webchatRef.current) {
        webchatRef.current.innerHTML = '';
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
    <div className="h-full w-full bg-white rounded-lg overflow-hidden">
      <div ref={webchatRef} className="h-full w-full" />
    </div>
  );
}