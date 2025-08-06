import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types";

interface BotpressChatProps {
  user: User;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function BotpressChat({ user, isCollapsed = false, onToggle }: BotpressChatProps) {
  const webchatRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isCollapsed && !isInitializedRef.current && webchatRef.current) {
      initializeBotpress();
      isInitializedRef.current = true;
    }
  }, [isCollapsed]);

  const initializeBotpress = () => {
    // Add custom styles for embedded webchat in the sidebar
    const style = document.createElement('style');
    style.textContent = `
      .botpress-webchat-container .bpw-widget {
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      
      .botpress-webchat-container .bpw-floating-button {
        display: none !important;
      }
      
      .botpress-webchat-container .bpw-chat-container {
        border-radius: 0 !important;
        height: 100% !important;
        max-height: 100% !important;
      }
    `;
    
    if (!document.querySelector('#botpress-chat-styles')) {
      style.id = 'botpress-chat-styles';
      document.head.appendChild(style);
    }

    // Load Botpress webchat script
    if (!document.querySelector('#botpress-webchat-script')) {
      const script = document.createElement('script');
      script.id = 'botpress-webchat-script';
      script.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
      script.onload = () => {
        // Initialize Botpress with embedded configuration
        if (window.botpress && webchatRef.current) {
          try {
            window.botpress.init({
              botId: "3f10c2b1-6fc1-4cf1-9f25-f5db2907d205",
              configuration: {
                version: "v1",
                website: {},
                email: {},
                phone: {},
                termsOfService: {},
                privacyPolicy: {},
                color: "#3276EA",
                variant: "solid",
                headerVariant: "glass",
                themeMode: "light",
                fontFamily: "inter",
                radius: 4,
                feedbackEnabled: false,
                footer: "[⚡ by Botpress](https://botpress.com/?from=webchat)"
              },
              clientId: "b98de221-d1f1-43c7-bad5-f279c104c231",
              selector: "#webchat-container"
            });
            
            // Automatically open the chat when ready
            window.botpress.on("webchat:ready", () => {
              window.botpress?.open();
            });
          } catch (error) {
            console.error("Botpress initialization error:", error);
            showFallbackChat();
          }
        } else {
          showFallbackChat();
        }
      };
      script.onerror = () => {
        console.warn("Failed to load Botpress webchat, using fallback interface");
        showFallbackChat();
      };
      document.head.appendChild(script);
    }
  };

  const showFallbackChat = () => {
    if (webchatRef.current) {
      webchatRef.current.innerHTML = `
        <div class="flex flex-col h-full bg-white">
          <div class="flex-1 p-4 overflow-y-auto space-y-3">
            <div class="flex justify-start">
              <div class="bg-slate-100 rounded-lg p-3 max-w-xs">
                <p class="text-sm text-slate-700">Hello! I'm your 51Talk CM Assistant. How can I help you today?</p>
              </div>
            </div>
            <div class="flex justify-start">
              <div class="bg-slate-100 rounded-lg p-3 max-w-xs">
                <p class="text-sm text-slate-700">I can help with:</p>
                <ul class="text-xs text-slate-600 mt-1 space-y-1">
                  <li>• CEJ curriculum questions (Levels S-9)</li>
                  <li>• Class consumption policy explanations</li>
                  <li>• Teacher points system clarification</li>
                  <li>• Parent communication strategies</li>
                  <li>• CEFR alignment details</li>
                  <li>• Common CM scenarios</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="border-t p-3">
            <div class="flex space-x-2">
              <input 
                type="text" 
                placeholder="Type your question..." 
                class="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onkeypress="if(event.key==='Enter') sendMessage(this)"
              />
              <button 
                onclick="sendMessage(this.previousElementSibling)"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Add global function for demo interaction
      (window as any).sendMessage = (input: HTMLInputElement) => {
        if (!input.value.trim()) return;
        
        const chatContainer = input.closest('.flex.flex-col')?.querySelector('.flex-1');
        if (chatContainer) {
          // Add user message
          const userMsg = document.createElement('div');
          userMsg.className = 'flex justify-end';
          userMsg.innerHTML = `
            <div class="bg-blue-600 text-white rounded-lg p-3 max-w-xs">
              <p class="text-sm">${input.value}</p>
            </div>
          `;
          chatContainer.appendChild(userMsg);
          
          // Add bot response after delay
          setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'flex justify-start';
            
            // Generate contextual response based on user input
            let response = "Thanks for your question! ";
            const msg = input.value.toLowerCase();
            
            if (msg.includes('consumption') || msg.includes('12 classes')) {
              response = "The 12 classes/month rule is based on the Ebbinghaus Forgetting Curve. Regular practice is essential for language retention. Would you like me to explain the learning loop: Preview → Class → Review → Test?";
            } else if (msg.includes('level') || msg.includes('cej')) {
              response = "CEJ has 11 levels (S-9) aligned with CEFR standards. Each level builds systematically: Level S focuses on 216 vocabulary words, while higher levels include complex grammar patterns. Which level are you asking about?";
            } else if (msg.includes('teacher') || msg.includes('points')) {
              response = "All 51Talk teachers pass a 3% screening rate and complete 100+ hours of training. Points reflect experience level, not quality. Filipino teachers offer clear accents with no time difference. Need help explaining this to a parent?";
            } else if (msg.includes('progress') || msg.includes('improvement')) {
              response = "Language progress typically shows in 2-3 months with regular classes. 51Talk tracks vocabulary acquisition (216-432 words per level) and grammar patterns. Have you shown the parent recorded class comparisons?";
            } else {
              response += "As a 51Talk CM, I can help with curriculum details, policy explanations, or parent communication strategies. What specific situation are you dealing with?";
            }
            
            botMsg.innerHTML = `
              <div class="bg-slate-100 rounded-lg p-3 max-w-xs">
                <p class="text-sm text-slate-700">${response}</p>
              </div>
            `;
            chatContainer.appendChild(botMsg);
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }, 1000);
          
          input.value = '';
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      };
    }
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

      <CardContent className="flex-1 p-0 overflow-hidden">
        {/* Botpress embedded webchat container */}
        <div className="botpress-webchat-container w-full h-full">
          <div 
            ref={webchatRef}
            id="webchat-container" 
            className="w-full h-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Extend window type for Botpress
declare global {
  interface Window {
    botpress?: {
      init: (config: any) => void;
      on: (event: string, callback: () => void) => void;
      open: () => void;
    };
  }
}
