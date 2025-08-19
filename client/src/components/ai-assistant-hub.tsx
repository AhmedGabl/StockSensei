import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Play, MessageCircle } from "lucide-react";
import { User } from "@shared/schema";

interface AIAssistantHubProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantHub({ user, isOpen, onClose }: AIAssistantHubProps) {
  const [activeTab, setActiveTab] = useState("scenarios");
  
  // Create shareable webchat URL with bot configuration
  const getShareableWebchatUrl = () => {
    const config = {
      "version": "v1",
      "botId": "3f10c2b1-6fc1-4cf1-9f25-f5db2907d205",
      "clientId": "b98de221-d1f1-43c7-bad5-f279c104c231",
      "botName": "51talk CM Assistant",
      "fabImage": "https://files.bpcontent.cloud/2025/08/17/14/20250817143903-J6S55SD1.jpeg",
      "website": {},
      "email": {},
      "phone": {},
      "termsOfService": {},
      "privacyPolicy": {},
      "color": "#000000",
      "variant": "solid",
      "headerVariant": "glass",
      "themeMode": "dark",
      "fontFamily": "inter",
      "radius": 4,
      "feedbackEnabled": false,
      "footer": "[⚡ by Botpress](https://botpress.com/?from=webchat)",
      "additionalStylesheetUrl": "https://files.bpcontent.cloud/2025/08/17/14/20250817144447-K1GSV0DH.css",
      "allowFileUpload": false
    };
    
    const configString = encodeURIComponent(JSON.stringify(config));
    return `https://cdn.botpress.cloud/webchat/v3.2/shareable.html?config=${configString}`;
  };

  const scenarios = [
    {
      id: 1,
      title: "Low Class Consumption - Ahmed",
      situation: "Ahmed, 10 YO, international school. His consumption this month is 10 Level 3, No Fixed schedule.",
      challenge: "Student has low class consumption and no fixed schedule",
      objectives: ["Understand reasons for low consumption", "Propose fixed schedule benefits", "Address parent concerns"]
    },
    {
      id: 2,
      title: "Absent Student - Yara",
      situation: "Yara 6 YO, fixed 5 per week, class consumption on 20th is only 6 classes (a lot of absences) Level S",
      challenge: "High absence rate despite fixed schedule",
      objectives: ["Identify absence patterns", "Work with parent on commitment", "Suggest makeup solutions"]
    },
    {
      id: 3,
      title: "Class Consumption Rule Complaint",
      situation: "Customer refuses to accept the class consumption rule and is angry about the 12 classes/month requirement",
      challenge: "Customer wants refund, claims they weren't informed about consumption rules",
      objectives: ["Explain consumption policy clearly", "Show value of regular classes", "Find compromise solution"]
    },
    {
      id: 4,
      title: "No Improvement Concern",
      situation: "Customer says there's no improvement in child's English level and wants refund",
      challenge: "Parent has unrealistic expectations about progress timeline",
      objectives: ["Explain 51Talk learning progression", "Show measurable improvements", "Set realistic expectations"]
    },
    {
      id: 5,
      title: "Global Teachers Points Issue",
      situation: "Customer angry about global teacher points system, wasn't informed by CC about point differences",
      challenge: "Pricing transparency and teacher selection confusion",
      objectives: ["Explain teacher point system", "Show value of different teachers", "Resolve billing concerns"]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            AI Training Hub
          </DialogTitle>
          <DialogDescription className="text-white/80">
            Practice scenarios for CM training development
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="scenarios" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Practice Scenarios
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                AI Assistant Chat
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="scenarios" className="h-[calc(100%-3rem)]">
              <div className="h-full">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Practice Scenarios</h3>
                  <p className="text-sm text-gray-600">Use these scenarios to practice your customer management skills</p>
                </div>
                
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {scenarios.map((scenario) => (
                      <Card key={scenario.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-semibold text-gray-800">
                              {scenario.title}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              Scenario {scenario.id}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Situation:</h4>
                            <p className="text-sm text-gray-600">{scenario.situation}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Challenge:</h4>
                            <p className="text-sm text-gray-600">{scenario.challenge}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Key Objectives:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {scenario.objectives.map((objective, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                                  {objective}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="pt-2">
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                console.log(`Starting practice scenario: ${scenario.title}`);
                              }}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start Practice
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="chatbot" className="h-[calc(100%-3rem)]">
              <div className="h-full">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">51talk CM Assistant</h3>
                  <p className="text-sm text-gray-600">Chat with the AI assistant for training support and Q&A</p>
                </div>
                
                <div className="h-[500px] w-full border rounded-lg overflow-hidden bg-white shadow-sm">
                  <iframe
                    src={getShareableWebchatUrl()}
                    className="w-full h-full border-0 ai-hub-iframe"
                    title="51talk CM Assistant"
                    allow="microphone; camera; clipboard-write"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                    style={{
                      background: 'transparent',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}