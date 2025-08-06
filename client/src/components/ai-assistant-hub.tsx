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

  const startVoicePracticeCall = () => {
    // Create a demo voice practice interface
    const voiceWindow = window.open('', '_blank', 'width=800,height=600');
    if (voiceWindow) {
      voiceWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Voice Practice Call - CM Training</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        <body class="bg-slate-50 min-h-screen">
          <div class="container mx-auto p-6 max-w-2xl">
            <div class="bg-white rounded-lg shadow-lg p-6">
              <div class="text-center mb-6">
                <div class="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-microphone text-white text-2xl"></i>
                </div>
                <h1 class="text-2xl font-bold text-slate-800">Voice Practice Session</h1>
                <p class="text-slate-600">Customer Service Scenario Practice</p>
              </div>
              
              <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                  <h3 class="font-semibold text-blue-900 mb-2">Scenario: Upset Customer - Product Return</h3>
                  <p class="text-blue-800 text-sm">A customer wants to return a product past the return window. Practice handling this situation professionally while following company policy.</p>
                </div>
                
                <div class="flex justify-center space-x-4">
                  <button onclick="startCall()" id="startBtn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2">
                    <i class="fas fa-phone"></i>
                    <span>Start Practice Call</span>
                  </button>
                  <button onclick="endCall()" id="endBtn" class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hidden">
                    <i class="fas fa-phone-slash"></i>
                    <span>End Call</span>
                  </button>
                </div>
                
                <div id="callStatus" class="hidden bg-green-50 p-4 rounded-lg text-center">
                  <div class="flex items-center justify-center space-x-2 mb-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-green-700 font-medium">Call in progress...</span>
                  </div>
                  <p class="text-sm text-green-600">Demo: In a real implementation, this would connect to Ringg AI for voice interaction</p>
                </div>
                
                <div id="callSummary" class="hidden bg-slate-50 p-4 rounded-lg">
                  <h4 class="font-semibold text-slate-800 mb-2">Call Summary</h4>
                  <div class="space-y-2 text-sm">
                    <p><span class="font-medium">Duration:</span> <span id="duration">0:00</span></p>
                    <p><span class="font-medium">Scenario:</span> Upset Customer - Product Return</p>
                    <p><span class="font-medium">Status:</span> <span class="text-green-600">Completed</span></p>
                  </div>
                </div>
              </div>
              
              <div class="mt-6 pt-4 border-t text-center">
                <button onclick="window.close()" class="text-slate-500 hover:text-slate-700 text-sm">
                  Close Practice Session
                </button>
              </div>
            </div>
          </div>
          
          <script>
            let startTime;
            let duration = 0;
            
            function startCall() {
              startTime = Date.now();
              document.getElementById('startBtn').classList.add('hidden');
              document.getElementById('endBtn').classList.remove('hidden');
              document.getElementById('callStatus').classList.remove('hidden');
              
              // Simulate call duration
              const interval = setInterval(() => {
                duration = Math.floor((Date.now() - startTime) / 1000);
                document.getElementById('duration').textContent = formatTime(duration);
              }, 1000);
              
              window.callInterval = interval;
            }
            
            function endCall() {
              clearInterval(window.callInterval);
              document.getElementById('endBtn').classList.add('hidden');
              document.getElementById('callStatus').classList.add('hidden');
              document.getElementById('callSummary').classList.remove('hidden');
              
              // Save practice call record
              fetch(window.opener.location.origin + '/api/practice-calls', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  scenario: 'Upset Customer - Product Return',
                  outcome: 'COMPLETED',
                  notes: 'Demo practice call completed'
                })
              }).catch(err => console.log('Demo mode - call not saved'));
            }
            
            function formatTime(seconds) {
              const mins = Math.floor(seconds / 60);
              const secs = seconds % 60;
              return mins + ':' + (secs < 10 ? '0' : '') + secs;
            }
          </script>
        </body>
        </html>
      `);
    }
    onClose();
  };

  const openTextAssistant = () => {
    // Create a demo text assistant interface
    const textWindow = window.open('', '_blank', 'width=900,height=700');
    if (textWindow) {
      textWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Advanced Text Assistant - CM Training</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        <body class="bg-slate-50 min-h-screen">
          <div class="container mx-auto p-6 max-w-4xl">
            <div class="bg-white rounded-lg shadow-lg h-[80vh] flex flex-col">
              <div class="p-4 border-b bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                <h1 class="text-xl font-bold">Advanced Text Assistant</h1>
                <p class="text-purple-100 text-sm">Get detailed help with complex training scenarios</p>
              </div>
              
              <div class="flex-1 flex">
                <div class="w-1/4 border-r bg-slate-50 p-4">
                  <h3 class="font-semibold text-slate-800 mb-3">Quick Topics</h3>
                  <div class="space-y-2">
                    <button onclick="loadTopic('policy')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Policy Questions</button>
                    <button onclick="loadTopic('scenarios')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Training Scenarios</button>
                    <button onclick="loadTopic('communication')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Communication Tips</button>
                    <button onclick="loadTopic('escalation')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Escalation Procedures</button>
                  </div>
                </div>
                
                <div class="flex-1 flex flex-col">
                  <div id="chatArea" class="flex-1 p-4 overflow-y-auto">
                    <div class="mb-4">
                      <div class="bg-purple-100 p-3 rounded-lg max-w-md">
                        <p class="text-sm text-purple-800">Hello! I'm your advanced text assistant. I can help with detailed training questions, policy interpretation, and complex scenarios. What would you like to know?</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="border-t p-4">
                    <div class="flex space-x-2">
                      <input 
                        type="text" 
                        id="messageInput"
                        placeholder="Ask me anything about CM training..." 
                        class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onkeypress="if(event.key==='Enter') sendMessage()"
                      />
                      <button 
                        onclick="sendMessage()"
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <script>
            function loadTopic(topic) {
              const chatArea = document.getElementById('chatArea');
              const responses = {
                policy: "Here are some key policy areas I can help with:\\n\\n• Return and refund policies\\n• Customer service standards\\n• Data privacy guidelines\\n• Escalation procedures\\n\\nWhat specific policy question do you have?",
                scenarios: "I can help with various training scenarios:\\n\\n• Difficult customer interactions\\n• Product knowledge questions\\n• Technical support situations\\n• Conflict resolution\\n\\nWhich scenario would you like to practice?",
                communication: "Key communication principles:\\n\\n• Active listening techniques\\n• Professional language guidelines\\n• Empathy and understanding\\n• Clear and concise responses\\n\\nWhat communication aspect interests you?",
                escalation: "Escalation procedures:\\n\\n• When to escalate to supervisor\\n• Documentation requirements\\n• Customer handoff process\\n• Follow-up responsibilities\\n\\nNeed help with a specific escalation situation?"
              };
              
              addMessage(responses[topic], 'assistant');
            }
            
            function sendMessage() {
              const input = document.getElementById('messageInput');
              const message = input.value.trim();
              if (!message) return;
              
              addMessage(message, 'user');
              input.value = '';
              
              // Simulate assistant response
              setTimeout(() => {
                const responses = [
                  "That's a great question! In situations like this, I recommend following these steps...",
                  "Based on company policy, the best approach would be to...",
                  "This is a common scenario. Here's how to handle it professionally...",
                  "Let me break this down for you with some specific guidance..."
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addMessage(randomResponse + "\\n\\n(This is a demo response. In a real implementation, this would connect to advanced AI for detailed, contextual answers.)", 'assistant');
              }, 1000);
            }
            
            function addMessage(text, sender) {
              const chatArea = document.getElementById('chatArea');
              const messageDiv = document.createElement('div');
              messageDiv.className = 'mb-4';
              
              if (sender === 'user') {
                messageDiv.innerHTML = \`
                  <div class="flex justify-end">
                    <div class="bg-purple-600 text-white p-3 rounded-lg max-w-md">
                      <p class="text-sm">\${text}</p>
                    </div>
                  </div>
                \`;
              } else {
                messageDiv.innerHTML = \`
                  <div class="bg-purple-100 p-3 rounded-lg max-w-md">
                    <p class="text-sm text-purple-800" style="white-space: pre-line">\${text}</p>
                  </div>
                \`;
              }
              
              chatArea.appendChild(messageDiv);
              chatArea.scrollTop = chatArea.scrollHeight;
            }
          </script>
        </body>
        </html>
      `);
    }
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
                  onClick={startVoicePracticeCall}
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
                  onClick={openTextAssistant}
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