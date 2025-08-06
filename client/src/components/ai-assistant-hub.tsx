import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotpressChat } from "./botpress-chat";
import { User } from "@/lib/types";

interface AIAssistantHubProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onStartPracticeCall: () => void;
}

export function AIAssistantHub({ user, isOpen, onClose, onStartPracticeCall }: AIAssistantHubProps) {
  const [activeTab, setActiveTab] = useState("chat");

  const startRinggPracticeCall = () => {
    onStartPracticeCall();
    onClose();
  };

  const openRinggTextAssistant = () => {
    // Open Ringg text assistant in new tab
    window.open('https://app.ringg.ai/text-assistant', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-robot text-white"></i>
            </div>
            <div>
              <span>AI Training Assistant Hub</span>
              <p className="text-sm font-normal text-slate-500">Choose your training method</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <i className="fas fa-comments"></i>
              <span>Q&A Chat</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center space-x-2">
              <i className="fas fa-microphone"></i>
              <span>Voice Practice</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center space-x-2">
              <i className="fas fa-keyboard"></i>
              <span>Text Assistant</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="h-96 mt-4">
            <div className="h-full border rounded-lg">
              <BotpressChat
                user={user}
                isCollapsed={false}
                onToggle={() => {}}
              />
            </div>
          </TabsContent>

          <TabsContent value="voice" className="mt-4">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-microphone text-white text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Voice Roleplay Practice</h3>
                <p className="text-slate-600 mb-6">
                  Practice real conversations with our AI trainer. Perfect your communication skills 
                  through realistic roleplay scenarios.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h4 className="font-semibold text-slate-800 mb-2">What You'll Practice</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Customer service conversations</li>
                    <li>• Conflict resolution scenarios</li>
                    <li>• Product knowledge discussions</li>
                    <li>• Professional communication</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h4 className="font-semibold text-slate-800 mb-2">How It Works</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• AI responds with realistic voice</li>
                    <li>• Real-time conversation flow</li>
                    <li>• Instant feedback and tips</li>
                    <li>• Progress tracking</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={startRinggPracticeCall}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8"
                >
                  <i className="fas fa-phone mr-2"></i>
                  Start Voice Practice Session
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-keyboard text-white text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Advanced Text Assistant</h3>
                <p className="text-slate-600 mb-6">
                  Get detailed help with complex training scenarios, documentation, and 
                  advanced problem-solving through our sophisticated text-based AI.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h4 className="font-semibold text-slate-800 mb-2">Advanced Features</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Detailed scenario analysis</li>
                    <li>• Step-by-step guidance</li>
                    <li>• Policy interpretation</li>
                    <li>• Custom training plans</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h4 className="font-semibold text-slate-800 mb-2">Best For</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Complex problem solving</li>
                    <li>• Detailed explanations</li>
                    <li>• Training documentation</li>
                    <li>• In-depth discussions</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={openRinggTextAssistant}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  Open Advanced Text Assistant
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              All AI Services Active
            </Badge>
          </div>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}